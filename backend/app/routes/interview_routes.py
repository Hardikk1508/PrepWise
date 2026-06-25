from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import json

from app.services.ai_service import generate_interview_questions, evaluate_answer
from app.database.db import get_db
from app.models.interview_session import InterviewSession
from app.schemas.interview_schema import InterviewCreate
from app.services.user_service import get_current_user
from app.models.user import User
from app.schemas.answer_schema import AnswerCreate
from app.models.answer import Answer

router = APIRouter()


@router.post("/sessions")
def create_session(
    session: InterviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    questions = generate_interview_questions(
        session.role,
        session.difficulty
    )

    new_session = InterviewSession(
        title=session.title,
        role=session.role,
        difficulty=session.difficulty,
        questions=questions,
        user_id=current_user.id
    )

    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return {
        "message": "Interview session created",
        "session": {
            "id": new_session.id,
            "title": new_session.title,
            "role": new_session.role,
            "difficulty": new_session.difficulty,
            "questions": questions
        }
    }


@router.get("/sessions")
def get_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sessions = db.query(InterviewSession).filter(
        InterviewSession.user_id == current_user.id
    ).all()

    return sessions


@router.post("/answers")
def submit_answer(
    answer_data: AnswerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    evaluation = evaluate_answer(
        answer_data.question,
        answer_data.answer
    )

    result = evaluation

    answer = Answer(
        session_id=answer_data.session_id,
        question=answer_data.question,
        answer=answer_data.answer,
        score=result.get("score"),
        feedback=result.get("feedback")
    )

    db.add(answer)
    db.commit()
    db.refresh(answer)

    return {
        "message": "Answer evaluated",
        "score": answer.score,
        "feedback": answer.feedback
    }

@router.get("/answers/{session_id}")
def get_answers(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    answers = db.query(Answer).filter(
        Answer.session_id == session_id
    ).all()

    return answers



