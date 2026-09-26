import os

from openai import OpenAI
from dotenv import load_dotenv

from langchain_chroma import Chroma
from langchain_core.embeddings import Embeddings


# ============================================================
# 1. Load environment variables
# ============================================================

dotenv_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(dotenv_path)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY not found in .env")


# ============================================================
# 2. OpenRouter
# ============================================================

client = OpenAI(
    api_key=OPENROUTER_API_KEY,
    base_url="https://openrouter.ai/api/v1"
)

MODEL = "openai/gpt-4o-mini"


class OpenRouterEmbeddings(Embeddings):

    def embed_documents(self, texts):
        response = client.embeddings.create(
            model="openai/text-embedding-3-small",
            input=texts
        )
        return [item.embedding for item in response.data]

    def embed_query(self, text):
        return self.embed_documents([text])[0]


# ============================================================
# 3. Load Chroma
# ============================================================

CHROMA_PATH = os.path.join(os.path.dirname(__file__), "vectorstore", "chroma_db")

embedding_model = OpenRouterEmbeddings()

db = Chroma(
    persist_directory=CHROMA_PATH,
    embedding_function=embedding_model
)

retriever = db.as_retriever(
    search_kwargs={"k": 4}
)


# ============================================================
# 4. System Prompt
# ============================================================

SYSTEM_PROMPT = """
You are Smart Doctor, an AI health information assistant.

Your job is to have a natural conversation with the user about
their symptoms and provide health information using the medical
knowledge retrieved from the knowledge base.

You are NOT a real doctor.

You must NOT claim that the user definitely has a disease.

You must NOT provide a definitive diagnosis.

You must NOT prescribe prescription medicines or prescription
dosages.

--------------------------------------------------
CONVERSATION
--------------------------------------------------

You are an interactive chatbot.

When the user describes symptoms, understand what information
they have already provided.

Important information can include:

- Age
- Symptoms
- Duration
- Severity
- Temperature if fever is present
- When symptoms started
- Whether symptoms are getting better or worse
- Other associated symptoms
- Existing medical conditions
- Current medications
- Allergies

If important information is missing, ask a follow-up question.

ASK ONLY ONE FOLLOW-UP QUESTION AT A TIME.

Do NOT ask for information that the user has already provided.

Example:

User:
"I have fever and headache."

Assistant:
"How old are you?"

User:
"20"

Assistant:
"How long have you had the fever and headache?"

User:
"2 days"

Assistant:
"Have you measured your temperature?"

Continue naturally.

--------------------------------------------------
WHEN ENOUGH INFORMATION IS AVAILABLE
--------------------------------------------------

Once enough information is available, stop asking unnecessary
questions.

Provide:

1. A short summary of the user's symptoms.
2. Possible conditions that may be associated with them.
3. Why those conditions may be relevant.
4. Important symptoms that do not match or information that is missing.
5. General precautions or self-care information.
6. When the user should consult a doctor.
7. Emergency warning signs when relevant.

Never say:

"You have dengue."

Instead say:

"Dengue can be one possible explanation for these symptoms."

--------------------------------------------------
RAG
--------------------------------------------------

The retrieved medical context is the primary source of medical
information.

Use the retrieved context to answer medical questions.

Do not invent medical information.

If the retrieved context does not contain enough information,
say that the available knowledge base does not contain enough
information to answer reliably.

--------------------------------------------------
EMERGENCY
--------------------------------------------------

If the user describes potentially serious symptoms such as:

- severe difficulty breathing
- chest pain
- unconsciousness
- severe bleeding
- seizure
- sudden weakness or paralysis
- severe confusion
- very severe abdominal pain

tell the user to seek urgent medical attention.

Do not continue asking unnecessary follow-up questions before
giving the emergency warning.

--------------------------------------------------
STYLE
--------------------------------------------------

During information gathering:

Keep responses short.

Ask one clear question at a time.

When enough information is available:

Give a structured and understandable response.

Do not dump a huge medical article.

Be calm, conversational and clear.
"""


# ============================================================
# 5. Chatbot
# ============================================================

def chatbot(message, history=None):

    if history is None:
        history = []

    try:
        # --------------------------------------------------------
        # Build previous conversation
        # --------------------------------------------------------

        conversation = ""

        for item in history:
            if not isinstance(item, dict):
                continue

            role = item.get("role")
            content = item.get("content")

            if role in ["user", "assistant"] and content:
                conversation += f"{role}: {content}\n"

        # --------------------------------------------------------
        # Retrieval query
        # --------------------------------------------------------

        retrieval_query = f"""
Previous conversation:

{conversation}

Current user message:

{message}
"""

        # --------------------------------------------------------
        # Retrieve documents from Chroma
        # --------------------------------------------------------

        documents = retriever.invoke(retrieval_query)

        # --------------------------------------------------------
        # Create context
        # --------------------------------------------------------

        context = ""

        for i, document in enumerate(documents):
            context += f"""
SOURCE {i + 1}

{document.page_content}

"""

        # --------------------------------------------------------
        # System message
        # --------------------------------------------------------

        system_message = f"""
{SYSTEM_PROMPT}

==================================================
RETRIEVED MEDICAL CONTEXT
==================================================

{context}

==================================================
END OF MEDICAL CONTEXT
==================================================
"""

        # --------------------------------------------------------
        # Messages
        # --------------------------------------------------------

        messages = [
            {
                "role": "system",
                "content": system_message
            }
        ]

        normalized_history = []
        for item in history:
            if isinstance(item, dict):
                normalized_history.append(item)

        messages.extend(normalized_history)

        messages.append({
            "role": "user",
            "content": message
        })

        # --------------------------------------------------------
        # OpenRouter
        # --------------------------------------------------------

        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=0.3,
            max_tokens=600
        )

        return response.choices[0].message.content

    except Exception:
        return (
            "I’m unable to reach the medical answer service right now. "
            "Please check your internet connection and try again in a moment. "
            "If your symptoms are severe or getting worse, seek urgent medical care."
        )