from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from decimal import Decimal
from backend.database import get_db
from backend.models import Order, OrderItem, Product, Customer
from backend.schemas import OrderCreate, OrderResponse

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_in: OrderCreate, db: Session = Depends(get_db)):
    # 1. Verify Customer exists
    customer = db.query(Customer).filter(Customer.id == order_in.customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Customer with ID {order_in.customer_id} does not exist."
        )

    # We use a transaction context or just let SQLAlchemy handle commit/rollback
    # Let's verify and process item details
    order_items_to_create = []
    total_amount = Decimal("0.00")

    # To avoid double-deducting or checking if the request lists the same product twice, 
    # we can group items by product_id or handle them sequentially with inventory updates.
    # Grouping is safer to ensure we validate the sum of quantities for a product.
    grouped_quantities = {}
    for item in order_in.items:
        if item.quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid quantity {item.quantity} for product ID {item.product_id}."
            )
        grouped_quantities[item.product_id] = grouped_quantities.get(item.product_id, 0) + item.quantity

    # Fetch all products in one query or check one by one
    products_cache = {}
    for product_id, req_qty in grouped_quantities.items():
        product = db.query(Product).filter(Product.id == product_id).with_for_update().first() # lock the row
        if not product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with ID {product_id} does not exist."
            )
        if product.quantity < req_qty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient inventory for product '{product.name}' (SKU: {product.sku}). Requested: {req_qty}, Available: {product.quantity}."
            )
        products_cache[product_id] = product

    # Deduct stock and prepare OrderItem instances
    for item in order_in.items:
        product = products_cache[item.product_id]
        
        # Deduct stock
        product.quantity -= item.quantity
        
        # Calculate item cost
        item_cost = Decimal(str(product.price)) * Decimal(item.quantity)
        total_amount += item_cost

        # Create OrderItem object
        db_item = OrderItem(
            product_id=product.id,
            quantity=item.quantity,
            unit_price=product.price
        )
        order_items_to_create.append(db_item)

    # 3. Create the Order
    db_order = Order(
        customer_id=customer.id,
        total_amount=total_amount,
        items=order_items_to_create
    )
    
    db.add(db_order)
    try:
        db.commit()
        db.refresh(db_order)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not create order: {str(e)}"
        )

    # Trigger relations load so they serialize nicely
    # (FastAPI automatically queries them due to lazy='select', but let's make sure)
    db_order.customer = customer
    for order_item in db_order.items:
        order_item.product = db.query(Product).filter(Product.id == order_item.product_id).first()

    return db_order

@router.get("", response_model=List[OrderResponse])
def get_orders(db: Session = Depends(get_db)):
    orders = db.query(Order).order_by(Order.created_at.desc()).all()
    # Eager load relationships for nice JSON output
    for o in orders:
        o.customer = db.query(Customer).filter(Customer.id == o.customer_id).first()
        for item in o.items:
            item.product = db.query(Product).filter(Product.id == item.product_id).first()
    return orders

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    order.customer = db.query(Customer).filter(Customer.id == order.customer_id).first()
    for item in order.items:
        item.product = db.query(Product).filter(Product.id == item.product_id).first()
    return order

@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    # Cancel and restock
    order = db.query(Order).filter(Order.id == order_id).with_for_update().first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Restock products
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
        if product:
            product.quantity += item.quantity

    db.delete(order)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not cancel order: {str(e)}"
        )
    return None
