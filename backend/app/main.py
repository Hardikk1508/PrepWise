from fastapi import FastAPI
from app.models.answer import Answer

from app.database.db import engine, Base
from app.models.user import User
from app.routes.auth import router as auth_router
from app.routes.user_routes import router as user_router
from app.models.interview_session import InterviewSession
from app.routes.interview_routes import router as interview_router

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(interview_router)

@app.get("/")
def home():
    return {"message": "PrepWise Backend Running"}





