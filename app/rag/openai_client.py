from openai import OpenAI
from app.config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)


def generate_answer(question: str, context: str):
    """
    Generate an answer using OpenAI.
    """

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an AI Research & Knowledge Assistant.\n"
                    "Answer ONLY using the provided document context.\n"
                    "If the answer is not present in the context, reply:\n"
                    "'I could not find that information in the uploaded documents.'"
                ),
            },
            {
                "role": "user",
                "content": f"""
Context:
{context}

Question:
{question}
""",
            },
        ],
        temperature=0.2,
    )

    return response.choices[0].message.content