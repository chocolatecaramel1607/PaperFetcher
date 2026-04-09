import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.paper import Paper
from app.models.user import User
from app.models.user_paper import UserPaper
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/papers", tags=["papers"])


class PaperResponse(BaseModel):
    id: int
    title: str
    authors: list[str]
    abstract: str
    pub_date: str
    source: str
    venue: str
    external_link: str
    pdf_link: str
    citation_count: int
    is_open_access: bool
    domain_tags: list[str]
    is_read: bool
    is_bookmarked: bool


class PaperListResponse(BaseModel):
    papers: list[PaperResponse]
    total: int
    page: int
    page_size: int
    has_more: bool


@router.get("", response_model=PaperListResponse)
async def get_papers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    domain: Optional[str] = None,
    sort_by: str = Query("date", pattern="^(date|citations)$"),
    bookmarked_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Paper, UserPaper)
        .join(UserPaper, UserPaper.paper_id == Paper.id)
        .where(UserPaper.user_id == current_user.id)
    )

    if domain:
        query = query.where(Paper.domain_tags.contains(domain))

    if bookmarked_only:
        query = query.where(UserPaper.is_bookmarked.is_(True))

    # Count total
    count_query = (
        select(func.count())
        .select_from(Paper)
        .join(UserPaper, UserPaper.paper_id == Paper.id)
        .where(UserPaper.user_id == current_user.id)
    )
    if domain:
        count_query = count_query.where(Paper.domain_tags.contains(domain))
    if bookmarked_only:
        count_query = count_query.where(UserPaper.is_bookmarked.is_(True))

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Sort
    if sort_by == "citations":
        query = query.order_by(Paper.citation_count.desc())
    else:
        query = query.order_by(Paper.pub_date.desc(), Paper.fetched_at.desc())

    # Paginate
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    rows = result.all()

    papers = []
    for paper, user_paper in rows:
        papers.append(PaperResponse(
            id=paper.id,
            title=paper.title,
            authors=json.loads(paper.authors),
            abstract=paper.abstract or "",
            pub_date=paper.pub_date or "",
            source=paper.source,
            venue=paper.venue or "",
            external_link=paper.external_link or "",
            pdf_link=paper.pdf_link or "",
            citation_count=paper.citation_count,
            is_open_access=paper.is_open_access,
            domain_tags=json.loads(paper.domain_tags),
            is_read=user_paper.is_read,
            is_bookmarked=user_paper.is_bookmarked,
        ))

    return PaperListResponse(
        papers=papers,
        total=total,
        page=page,
        page_size=page_size,
        has_more=(offset + page_size) < total,
    )


@router.post("/{paper_id}/bookmark")
async def toggle_bookmark(
    paper_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserPaper).where(
            UserPaper.user_id == current_user.id,
            UserPaper.paper_id == paper_id,
        )
    )
    user_paper = result.scalar_one_or_none()
    if not user_paper:
        raise HTTPException(status_code=404, detail="Paper not found in your feed")

    user_paper.is_bookmarked = not user_paper.is_bookmarked
    await db.commit()
    return {"bookmarked": user_paper.is_bookmarked}


@router.post("/{paper_id}/read")
async def mark_as_read(
    paper_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserPaper).where(
            UserPaper.user_id == current_user.id,
            UserPaper.paper_id == paper_id,
        )
    )
    user_paper = result.scalar_one_or_none()
    if not user_paper:
        raise HTTPException(status_code=404, detail="Paper not found in your feed")

    user_paper.is_read = not user_paper.is_read
    await db.commit()
    return {"is_read": user_paper.is_read}
