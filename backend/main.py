from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from backend.config import settings
from backend.database import engine, Base, get_db
from backend.models import Product, Customer, Order
from backend.schemas import DashboardSummary, ProductResponse
from backend.routers import products, customers, orders

# Proactively create tables if they do not exist
# In production with alembic, this would be a migration, but for local/containerized setup
# doing it at startup is highly robust and avoids migration script errors.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Inventory and Order Management System API",
    version="1.0.0"
)

# CORS Setup
origins = [x.strip() for x in settings.ALLOWED_HOSTS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)

@app.get("/")
def read_root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "docs_url": "/docs",
        "status": "healthy"
    }

@app.get("/dashboard/summary", response_model=DashboardSummary, tags=["Dashboard"])
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_products = db.query(Product).count()
    total_customers = db.query(Customer).count()
    total_orders = db.query(Order).count()
    
    # Define low stock threshold as less than 10 units
    low_stock_products = db.query(Product).filter(Product.quantity < 10).order_by(Product.quantity.asc()).all()
    
    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "low_stock_products": low_stock_products
    }
