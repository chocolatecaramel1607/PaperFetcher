import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Paper(Base):
    __tablename__ = "papers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    authors: Mapped[str] = mapped_column(Text, nullable=False)  # JSON string
    abstract: Mapped[str] = mapped_column(Text, nullable=True)
    pub_date: Mapped[str] = mapped_column(String(20), nullable=True)
    source: Mapped[str] = mapped_column(String(50), nullable=False)
    venue: Mapped[str] = mapped_column(String(255), nullable=True)
    external_link: Mapped[str] = mapped_column(String(500), nullable=True)
    pdf_link: Mapped[str] = mapped_column(String(500), nullable=True)
    citation_count: Mapped[int] = mapped_column(Integer, default=0)
    is_open_access: Mapped[bool] = mapped_column(Boolean, default=False)
    domain_tags: Mapped[str] = mapped_column(Text, nullable=False)  # JSON string
    fetched_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
    # Unique identifier from source to prevent duplicates
    source_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)

    user_interactions = relationship(
        "UserPaper", back_populates="paper", cascade="all, delete-orphan"
    )
