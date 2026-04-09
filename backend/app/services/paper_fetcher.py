import json
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.paper import Paper
from app.models.user_paper import UserPaper
from app.sources.arxiv import ArxivSource
from app.sources.base import BasePaperSource, PaperResult
from app.sources.pubmed import PubMedSource
from app.sources.semantic_scholar import SemanticScholarSource

logger = logging.getLogger(__name__)

PRESET_DOMAINS = [
    "Deep Reinforcement Learning",
    "Reinforcement Learning",
    "NLP / Large Language Models",
    "Computer Vision",
    "Robotics & Control Systems",
    "Neural Architecture Search",
    "Autonomous Vehicles",
    "Bioinformatics",
    "Graph Neural Networks",
    "Multimodal AI",
    "Time Series Forecasting",
    "AI Safety",
    "Closed-form Continuous-time Networks",
    "Neural Circuit Policies",
]

SOURCE_MAP: dict[str, type[BasePaperSource]] = {
    "semantic_scholar": SemanticScholarSource,
    "arxiv": ArxivSource,
    "pubmed": PubMedSource,
}


def get_configured_sources() -> list[BasePaperSource]:
    source_names = [s.strip() for s in settings.paper_sources.split(",")]
    sources = []
    for name in source_names:
        cls = SOURCE_MAP.get(name)
        if cls:
            sources.append(cls())
    return sources


async def get_available_domains() -> tuple[list[str], str]:
    """Get available domains. Returns (domains, source_name)."""
    sources = get_configured_sources()
    for source in sources:
        try:
            domains = await source.get_available_domains()
            if domains:
                return domains, source.name
        except Exception:
            continue
    return PRESET_DOMAINS, "preset"


async def fetch_papers_for_domains(
    db: AsyncSession,
    user_id: int,
    domains: list[str],
) -> tuple[int, str]:
    """Fetch papers for given domains. Returns (count_new_papers, source_used)."""
    sources = get_configured_sources()
    total_new = 0
    source_used = "none"

    for domain in domains:
        fetched = False
        for source in sources:
            try:
                logger.info(f"Fetching '{domain}' from {source.name}")
                results = await source.search_papers(
                    domain, max_results=settings.max_papers_per_domain
                )
                source_used = source.name
                new_count = await _store_papers(db, user_id, results, domain)
                total_new += new_count
                fetched = True
                break
            except Exception as e:
                logger.warning(f"{source.name} failed for '{domain}': {e}, trying next source")
                continue

        if not fetched:
            logger.error(f"All sources failed for domain '{domain}'")

    return total_new, source_used


async def _store_papers(
    db: AsyncSession,
    user_id: int,
    results: list[PaperResult],
    domain: str,
) -> int:
    """Store papers in DB and create user-paper associations. Returns count of new papers."""
    new_count = 0

    for result in results:
        # Check if paper already exists
        existing = await db.execute(
            select(Paper).where(Paper.source_id == result.source_id)
        )
        paper = existing.scalar_one_or_none()

        if paper is None:
            paper = Paper(
                title=result.title,
                authors=json.dumps(result.authors),
                abstract=result.abstract,
                pub_date=result.pub_date,
                source=result.source,
                venue=result.venue,
                external_link=result.external_link,
                pdf_link=result.pdf_link,
                citation_count=result.citation_count,
                is_open_access=result.is_open_access,
                domain_tags=json.dumps(result.domain_tags),
                source_id=result.source_id,
            )
            db.add(paper)
            await db.flush()
            new_count += 1

        # Check if user already has this paper
        existing_up = await db.execute(
            select(UserPaper).where(
                UserPaper.user_id == user_id,
                UserPaper.paper_id == paper.id,
            )
        )
        if existing_up.scalar_one_or_none() is None:
            user_paper = UserPaper(
                user_id=user_id,
                paper_id=paper.id,
            )
            db.add(user_paper)

    await db.commit()
    return new_count
