from sqlalchemy import Column, Integer, String, Boolean
from database import Base


class StudyPlanItem(Base):
    """Represents a single day in a study plan."""
    __tablename__ = "study_plans"

    id = Column(Integer, primary_key=True, index=True)
    course = Column(String, nullable=False)
    day = Column(Integer, nullable=False)
    topic = Column(String, nullable=False)
    done = Column(Boolean, default=False)
