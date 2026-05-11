from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
import uvicorn
import os

from core.config import config
from core.database import init_database
from utils.logger import logger

# Import only lightweight routes at startup
from routes import auth_routes, stock_routes

# ⚠️ Avoid importing heavy ML routes during startup on Render
# from routes import prediction_routes, watchlist_routes


# ==========================================
# Application Lifespan
# ==========================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""

    logger.info(f"🚀 Starting {config.APP_NAME}...")

    try:
        init_database()
        logger.info("✅ Database initialized successfully")

    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")

    logger.info("📚 Swagger Docs available at /docs")
    logger.info("📕 ReDoc available at /redoc")

    yield

    logger.info(f"🛑 Shutting down {config.APP_NAME}...")


# ==========================================
# FastAPI App Initialization
# ==========================================
app = FastAPI(
    title=config.APP_NAME,
    description="AI Stock Prediction Platform",
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

# ==========================================
# Optional ML Routes (Lazy Import)
# ==========================================
try:
    from routes import prediction_routes

    app.include_router(
        prediction_routes.router,
        prefix=config.API_V1_PREFIX,
        tags=["Predictions"],
    )

    logger.info("✅ Prediction routes loaded")

except Exception as e:
    logger.warning(f"⚠️ Prediction routes disabled: {e}")


try:
    from routes import watchlist_routes

    app.include_router(
        watchlist_routes.router,
        prefix=config.API_V1_PREFIX,
        tags=["Watchlist"],
    )

    logger.info("✅ Watchlist routes loaded")

except Exception as e:
    logger.warning(f"⚠️ Watchlist routes disabled: {e}")


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
# Render / Local Run
# ==========================================
if __name__ == "__main__":

    # Render automatically provides PORT
    port = int(os.environ.get("PORT", 8000))

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=config.DEBUG,
    )