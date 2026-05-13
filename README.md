# SkillMesh

SkillMesh is a full-stack platform connecting customers with skilled workers (plumbers, electricians, etc.) using geospatial matching and ML-driven insights.

## Project Structure

- `backend/`: Node.js Express server with PostgreSQL and Redis.
- `frontend/admin/`: Vite React dashboard for administrators.
- `frontend/customer/`: Expo/React Native app for customers.
- `frontend/worker/`: Expo/React Native app for service providers.
- `ml-services/`: FastAPI service for intent parsing, fraud detection, and pricing estimation.
- `docs/`: Project documentation.

## How to Run

### 1. Prerequisites
- Node.js & npm
- Docker & Docker Compose
- Python 3.11+ (for ML services)

### 2. Infrastructure
Start PostgreSQL (PostGIS) and Redis using Docker:
```bash
docker-compose up -d
```

### 3. Backend
```bash
cd backend
npm install
# Ensure .env is configured
node index.js
```

### 4. Frontends

#### Admin Dashboard
```bash
cd frontend/admin
npm install
npm run dev
```

#### Customer App (Mobile)
```bash
cd frontend/customer
npm install
npx expo start
```

#### Worker App (Mobile)
```bash
cd frontend/worker
npm install
npx expo start
```

### 5. ML Services
```bash
cd ml-services
# Create/activate venv if needed
pip install -r requirements.txt
python main.py
```
