from ollama import chat


def generate_answer(question: str, context: str):
    """
    Generate an answer using Ollama (Llama 3.2).
    """

    response = chat(
        model="llama3.2",
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
    )

    return response["message"]["content"]