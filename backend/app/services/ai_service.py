from google import genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def generate_interview_questions(role: str, difficulty: str):

    prompt = f"""
Generate 5 interview questions for:

Role: {role}
Difficulty: {difficulty}

Return only the questions as a numbered list.
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        questions_text = response.text

        questions = [
            q.strip()
            for q in questions_text.split("\n")
            if q.strip()
        ]

        return questions

    except Exception as e:
        print("Gemini Error:", e)

        return [
            "Tell me about yourself.",
            "What are your strengths?",
            "What are your weaknesses?",
            "Why do you want this role?",
            "Describe a challenging project you worked on."
        ]

def evaluate_answer(question: str, answer: str):

    prompt = f"""
Question:
{question}

Candidate Answer:
{answer}

Evaluate the answer.

Return ONLY valid JSON:

{{
  "score": 8,
  "feedback": "Good understanding of the topic."
}}
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        text = response.text.strip()

        if text.startswith("```json"):
            text = text.replace("```json", "").replace("```", "").strip()

        result = json.loads(text)

        return result

    except Exception as e:
        print("Gemini Error:", e)

        return {
            "score": 0,
            "feedback": f"AI evaluation failed: {str(e)}"
        }



