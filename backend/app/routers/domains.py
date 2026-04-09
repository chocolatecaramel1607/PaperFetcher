from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.user_domain import UserDomain
from app.services.auth import get_current_user
from app.services.paper_fetcher import get_available_domains

router = APIRouter(prefix="/api", tags=["domains"])


class DomainsResponse(BaseModel):
    domains: list[str]
    source: str


class UserSettingsResponse(BaseModel):
    domains: list[dict]
    domains_selected: bool


class UpdateSettingsRequest(BaseModel):
    domains: list[dict]  # [{"name": "...", "is_custom": bool}]


@router.get("/domains", response_model=DomainsResponse)
async def list_domains():
    domains, source = await get_available_domains()
    return DomainsResponse(domains=domains, source=source)


@router.get("/settings", response_model=UserSettingsResponse)
async def get_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserDomain).where(UserDomain.user_id == current_user.id)
    )
    user_domains = result.scalars().all()

    return UserSettingsResponse(
        domains=[
            {"name": d.domain_name, "is_custom": d.is_custom}
            for d in user_domains
        ],
        domains_selected=current_user.domains_selected,
    )


@router.post("/settings", response_model=UserSettingsResponse)
async def update_settings(
    req: UpdateSettingsRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Remove existing domains
    await db.execute(
        delete(UserDomain).where(UserDomain.user_id == current_user.id)
    )

    # Add new domains
    for domain_data in req.domains:
        domain = UserDomain(
            user_id=current_user.id,
            domain_name=domain_data["name"],
            is_custom=domain_data.get("is_custom", False),
        )
        db.add(domain)

    current_user.domains_selected = True
    await db.commit()

    return UserSettingsResponse(
        domains=[
            {"name": d["name"], "is_custom": d.get("is_custom", False)}
            for d in req.domains
        ],
        domains_selected=True,
    )
