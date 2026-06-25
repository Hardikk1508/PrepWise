from pydantic import BaseModel


class InterviewCreate(BaseModel):
    title: str
    role: str
    difficulty: str

