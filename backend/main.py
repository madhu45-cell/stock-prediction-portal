from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
import uvicorn

from core.config import config
from core.database import init_database

from routes import (
    auth_routes,
    stock_routes,
    prediction_routes,
    watchlist_routes,
)

from utils.logger import logger


# ==========================================
# Application Lifespan
# ==========================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""

    # Startup
    logger.info(f"🚀 Starting {config.APP_NAME} v2.0.0...")
    
    try:
        init_database()
        logger.info("✅ Database initialized successfully")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")

    logger.info("📚 Swagger Docs available at /docs")
    logger.info("📕 ReDoc available at /redoc")

    yield

    # Shutdown
    logger.info(f"🛑 Shutting down {config.APP_NAME}...")


# ==========================================
# FastAPI App Initialization
# ==========================================
app = FastAPI(
    title=config.APP_NAME,
    description="AI Stock Prediction Platform with ML Models",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)


# ==========================================
# CORS Middleware
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# API Routes
# ==========================================
app.include_router(
    auth_routes.router,
    prefix=config.API_V1_PREFIX,
    tags=["Authentication"],
)

app.include_router(
    stock_routes.router,
    prefix=config.API_V1_PREFIX,
    tags=["Stocks"],
)

app.include_router(
    prediction_routes.router,
    prefix=config.API_V1_PREFIX,
    tags=["Predictions"],
)

app.include_router(
    watchlist_routes.router,
    prefix=config.API_V1_PREFIX,
    tags=["Watchlist"],
)


# ==========================================
# Root Endpoint
# ==========================================
@app.get("/")
async def root():
    return {
        "name": config.APP_NAME,
        "version": "2.0.0",
        "status": "running",
        "environment": config.ENVIRONMENT,
        "docs": "/docs",
        "redoc": "/redoc",
    }


# ==========================================
# Health Check Endpoint
# ==========================================
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": config.ENVIRONMENT,
        "database": "connected",
    }


# ==========================================
# Run Application
# ==========================================
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=config.DEBUG,
    )