import urllib.request
import json

BASE_URL = "http://localhost:8000"

def make_request(path, method="GET", data=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    req_data = json.dumps(data).encode("utf-8") if data else None
    
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 204:
                return None, 204
            return json.loads(response.read().decode("utf-8")), response.status
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode("utf-8")), e.code

print("=== STARTING API VERIFICATION ===")

# Clean up prior runs if any to ensure idempotency
prods, _ = make_request("/products")
if isinstance(prods, list):
    for p in prods:
        if p["sku"] == "MOUSE001":
            make_request(f"/products/{p['id']}", "DELETE")

custs, _ = make_request("/customers")
if isinstance(custs, list):
    for c in custs:
        if c["email"] == "alice@example.com":
            make_request(f"/customers/{c['id']}", "DELETE")

# 1. Create a Product
product_data = {"name": "Test Mouse", "sku": "MOUSE001", "price": 25.50, "quantity": 10}

res, code = make_request("/products", "POST", product_data)
assert code == 201, f"Expected 201, got {code}: {res}"
product_id = res["id"]
print(f"[OK] Product created. ID: {product_id}, SKU: {res['sku']}")

# 2. Try creating the same SKU (should fail with 400)
res, code = make_request("/products", "POST", product_data)
assert code == 400, f"Expected 400, got {code}: {res}"
print("[OK] Duplicate SKU rejected correctly.")

# 3. Try creating negative quantity (should fail with 422 or 400)
bad_product = {"name": "Bad Mouse", "sku": "MOUSE002", "price": 25.50, "quantity": -5}
res, code = make_request("/products", "POST", bad_product)
assert code in (400, 422), f"Expected 400 or 422, got {code}: {res}"
print("[OK] Negative quantity rejected correctly.")

# 4. Create a Customer
customer_data = {"full_name": "Alice Smith", "email": "alice@example.com", "phone": "123-456-7890"}
res, code = make_request("/customers", "POST", customer_data)
assert code == 201, f"Expected 201, got {code}: {res}"
customer_id = res["id"]
print(f"[OK] Customer created. ID: {customer_id}, Email: {res['email']}")

# 5. Try duplicate email (should fail with 400)
res, code = make_request("/customers", "POST", customer_data)
assert code == 400, f"Expected 400, got {code}: {res}"
print("[OK] Duplicate email rejected correctly.")

# 6. Place Order with insufficient stock (should fail with 400)
order_data = {
    "customer_id": customer_id,
    "items": [{"product_id": product_id, "quantity": 15}] # Available: 10
}
res, code = make_request("/orders", "POST", order_data)
assert code == 400, f"Expected 400, got {code}: {res}"
print("[OK] Order with insufficient stock rejected correctly.")

# 7. Place Order with sufficient stock (should succeed)
order_data["items"][0]["quantity"] = 3 # Available: 10
res, code = make_request("/orders", "POST", order_data)
assert code == 201, f"Expected 201, got {code}: {res}"
order_id = res["id"]
print(f"[OK] Order placed successfully. ID: {order_id}, Total Calculated: ${res['total_amount']}")

# 8. Check stock was reduced (should be 7)
res, code = make_request(f"/products/{product_id}")
assert code == 200 and res["quantity"] == 7, f"Expected stock 7, got: {res}"
print(f"[OK] Inventory reduced correctly. Remaining stock: {res['quantity']}")

# 9. Cancel Order (should restore stock to 10)
res, code = make_request(f"/orders/{order_id}", "DELETE")
assert code == 204, f"Expected 204, got {code}: {res}"
print("[OK] Order deleted/cancelled.")

# 10. Check stock was restored to 10
res, code = make_request(f"/products/{product_id}")
assert code == 200 and res["quantity"] == 10, f"Expected stock 10, got: {res}"
print(f"[OK] Stock restored correctly on cancellation. Stock: {res['quantity']}")

# 11. Clean up products and customers
res, code = make_request(f"/products/{product_id}", "DELETE")
assert code == 204, f"Expected 204, got {code}: {res}"
res, code = make_request(f"/customers/{customer_id}", "DELETE")
assert code == 204, f"Expected 204, got {code}: {res}"
print("[OK] Cleaned up test data.")

print("=== ALL API TESTS PASSED SUCCESSFULLY ===")
