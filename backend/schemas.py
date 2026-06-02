from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import List, Optional
from decimal import Decimal
from datetime import datetime

# ================= Product Schemas =================
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    sku: str = Field(..., min_length=1, max_length=50)
    price: Decimal = Field(..., ge=0)
    quantity: int = Field(..., ge=0)

    @field_validator('sku')
    @classmethod
    def validate_sku(cls, v: str) -> str:
        return v.strip().upper()

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    sku: Optional[str] = Field(None, min_length=1, max_length=50)
    price: Optional[Decimal] = Field(None, ge=0)
    quantity: Optional[int] = Field(None, ge=0)

    @field_validator('sku')
    @classmethod
    def validate_sku(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return v.strip().upper()
        return v

class ProductResponse(ProductBase):
    id: int

    class Config:
        from_attributes = True


# ================= Customer Schemas =================
class CustomerBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=1, max_length=30)

    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        return v.strip().lower()

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int

    class Config:
        from_attributes = True


# ================= Order Item Schemas =================
class OrderItemCreate(BaseModel):
    product_id: int = Field(..., ge=1)
    quantity: int = Field(..., ge=1)

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True


# ================= Order Schemas =================
class OrderCreate(BaseModel):
    customer_id: int = Field(..., ge=1)
    items: List[OrderItemCreate] = Field(..., min_length=1)

class OrderResponse(BaseModel):
    id: int
    customer_id: int
    total_amount: Decimal
    created_at: datetime
    customer: Optional[CustomerResponse] = None
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True


# ================= Dashboard Summary Schema =================
class DashboardSummary(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_products: List[ProductResponse]
