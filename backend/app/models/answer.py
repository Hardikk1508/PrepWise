from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from datetime import datetime

from app.database.db import Base


class Answer(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, index=True)

    session_id = Column(
        Integer,
        ForeignKey("interview_sessions.id")
    )

    question = Column(String, nullable=False)

    answer = Column(String, nullable=False)

    score = Column(Integer, nullable=True)

    feedback = Column(String, nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

