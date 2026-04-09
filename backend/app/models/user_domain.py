from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class UserDomain(Base):
    __tablename__ = "user_domains"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    domain_name: Mapped[str] = mapped_column(String(200), nullable=False)
    is_custom: Mapped[bool] = mapped_column(Boolean, default=False)

    user = relationship("User", back_populates="domains")
