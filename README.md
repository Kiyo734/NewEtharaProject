# StockFlow | Inventory & Order Management System

StockFlow is a production-ready, full-stack containerized Inventory & Order Management System. It allows businesses to manage Products, Customers, and Orders with real-time stock updates, automated billing calculations, and database validation constraints.

## Technical Stack
- **Frontend**: React (JavaScript), Vite, Lucide Icons, and Custom Glassmorphic CSS.
- **Backend**: Python 3.11+, FastAPI, SQLAlchemy ORM, and Pydantic validation.
- **Database**: PostgreSQL (Production) / SQLite (Local host fallback).
- **Containerization**: Docker & Docker Compose.

---

## Project Structure
- `backend/`: FastAPI application code, database configuration, routing, and Dockerfile.
- `frontend/`: React SPA source code, Nginx server configuration, and Dockerfile.
- `docker-compose.yml`: Local orchestrator for DB, Backend, and Frontend containers.

---

## Docker Containerized Setup (Production Ready)

The project is fully prepared for multi-container Docker orchestration.

### Prerequisites
- Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### How to Run
1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
2. Build and start the services:
   ```bash
   docker compose up --build
   ```
3. Once running, open:
   - **Frontend UI**: `http://localhost:3000` (served via Nginx)
   - **Backend Swagger API**: `http://localhost:8000/docs`

---

## Local Development Setup (Host Machine Fallback)

If Docker registry issues or CloudFront blocks prevent pulling images locally, you can run the system directly on the host using the built-in SQLite database fallback.

### 1. Run the FastAPI Backend
1. Open a terminal in the root directory and create a Python virtual environment:
   ```bash
   python -m venv venv
   ```
2. Activate the virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\activate
     ```
   - **Linux / macOS**:
     ```bash
     source venv/bin/activate
     ```
3. Install Python dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
4. Start the API server pointing to a local SQLite database:
   - **Windows (PowerShell)**:
     ```powershell
     $env:DATABASE_URL="sqlite:///./backend/inventory.db"
     python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
     ```
   - **Linux / macOS**:
     ```bash
     DATABASE_URL="sqlite:///./backend/inventory.db" python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
     ```

### 2. Run the React Frontend
1. Open a new terminal in the `frontend/` directory.
2. Install node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173/`.

---

## Database Constraints & Validations
The backend enforces the following business logic:
- **Unique SKU**: Product SKU/code must be unique across all products.
- **Unique Email**: Customer email address must be unique.
- **Stock Constraints**: Product stock quantity cannot be negative.
- **Inventory Check**: Orders cannot be placed if the requested quantity exceeds available stock.
- **Auto-Deduction**: Placing an order automatically reduces stock.
- **Auto-Restock**: Deleting/cancelling an order automatically restores the items back to stock.
- **Auto-Price Calculation**: Total billing is calculated on the backend based on current product unit prices.

You can verify these validations locally by running the test script:
```bash
python backend/verify.py
```
