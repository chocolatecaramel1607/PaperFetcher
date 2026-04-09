import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.user_domain import UserDomain
from app.services.auth import get_current_user
from app.services.paper_fetcher import fetch_papers_for_domains

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["refresh"])


class RefreshResponse(BaseModel):
    new_papers: int
    source_used: str
    timestamp: str


@router.post("/refresh", response_model=RefreshResponse)
async def refresh_papers(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Get user's domains
    result = await db.execute(
        select(UserDomain).where(UserDomain.user_id == current_user.id)
    )
    user_domains = result.scalars().all()

    if not user_domains:
        return RefreshResponse(
            new_papers=0,
            source_used="none",
            timestamp=datetime.now(timezone.utc).isoformat(),
        )

    domain_names = [d.domain_name for d in user_domains]
    new_count, source_used = await fetch_papers_for_domains(db, current_user.id, domain_names)

    return RefreshResponse(
        new_papers=new_count,
        source_used=source_used,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
