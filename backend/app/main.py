import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import auth, domains, papers, refresh
from app.scheduler import start_scheduler, stop_scheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    start_scheduler()
    logger.info("PaperFetcher backend started")
    yield
    stop_scheduler()
    logger.info("PaperFetcher backend stopped")


app = FastAPI(
    title="PaperFetcher API",
    description="Research paper recommendation backend",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(papers.router)
app.include_router(domains.router)
app.include_router(refresh.router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
