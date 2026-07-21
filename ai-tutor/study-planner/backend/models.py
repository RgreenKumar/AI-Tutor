from sqlalchemy import (
    Column, Integer, String, Boolean, Date, DateTime, Text, UniqueConstraint
)
from sqlalchemy.sql import func
from database import Base


class User(Base):
    """A registered user. Passwords are stored only as bcrypt hashes."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # Password-reset token + expiry (set by /auth/forgot-password).
    reset_token = Column(String, nullable=True)
    reset_expires = Column(DateTime(timezone=True), nullable=True)


class StudyPlanItem(Base):
    """Represents a single day in a study plan."""
    __tablename__ = "study_plans"

    id = Column(Integer, primary_key=True, index=True)
    course = Column(String, nullable=False)
    day = Column(Integer, nullable=False)
    topic = Column(String, nullable=False)
    done = Column(Boolean, default=False)
    date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # Nullable so pre-auth rows keep working (un-owned).
    user_id = Column(Integer, nullable=True, index=True)


class Note(Base):
    """A free-text note for one day of a study plan, with an optional AI summary.

    One note per (course, day) pair — enforced by a unique constraint.
    """
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    course = Column(String, nullable=False)
    day = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    ai_summary = Column(Text, nullable=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
    user_id = Column(Integer, nullable=True, index=True)

    __table_args__ = (
        UniqueConstraint("user_id", "course", "day", name="uq_notes_user_course_day"),
    )


class Document(Base):
    """An uploaded study document with its extracted plain text."""
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    text_content = Column(Text, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(Integer, nullable=True, index=True)
