import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.api.v1 import api_router
from app.services.seed import seed_database
from app.database import engine, Base

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("rapidAID")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist and seed database
    logger.info("Initializing rapidAID Database and AI Subsystems...")
    Base.metadata.create_all(bind=engine)
    seed_database()
    logger.info("rapidAID Backend started successfully.")
    yield
    logger.info("rapidAID Backend shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="rapidAID — AI-Powered Citizen Call Intelligence & Emergency Resource Allocation Platform",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Configure CORS for local dev and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For hackathon/demo ease of access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"}
    )

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "service": "rapidAID Backend API",
        "version": settings.VERSION,
        "ai_mode": settings.AI_MODE,
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
