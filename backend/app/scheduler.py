import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select

from app.config import settings
from app.database import async_session
from app.models.user import User
from app.models.user_domain import UserDomain
from app.services.paper_fetcher import fetch_papers_for_domains

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def daily_fetch_all_users():
    """Fetch papers for all users who have selected domains."""
    logger.info("Starting daily paper fetch for all users")

    async with async_session() as db:
        result = await db.execute(
            select(User).where(User.domains_selected.is_(True))
        )
        users = result.scalars().all()

        for user in users:
            try:
                domain_result = await db.execute(
                    select(UserDomain).where(UserDomain.user_id == user.id)
                )
                user_domains = domain_result.scalars().all()
                domain_names = [d.domain_name for d in user_domains]

                if domain_names:
                    new_count, source = await fetch_papers_for_domains(
                        db, user.id, domain_names
                    )
                    logger.info(
                        f"Fetched {new_count} new papers for user {user.username} "
                        f"from {source}"
                    )
            except Exception as e:
                logger.error(f"Failed to fetch papers for user {user.username}: {e}")
                continue

    logger.info("Daily paper fetch completed")


def start_scheduler():
    scheduler.add_job(
        daily_fetch_all_users,
        "cron",
        hour=settings.daily_fetch_hour,
        minute=settings.daily_fetch_minute,
        id="daily_paper_fetch",
        replace_existing=True,
    )
    scheduler.start()
    logger.info(
        f"Scheduler started: daily fetch at "
        f"{settings.daily_fetch_hour:02d}:{settings.daily_fetch_minute:02d}"
    )


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
