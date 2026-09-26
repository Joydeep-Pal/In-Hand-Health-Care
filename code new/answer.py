import base64
import os
import sys
from pathlib import Path

import uvicorn
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from chatbot import chatbot


app = FastAPI()
frontend_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AI_DOCTOR_PATH = Path(__file__).resolve().parent.parent / "ai-doctor"
sys.path.insert(0, str(AI_DOCTOR_PATH))


# ============================================================
# Request structure
# ============================================================

class ChatRequest(BaseModel):

    message: str
    history: list = Field(default_factory=list)


# ============================================================
# Chat API
# ============================================================

@app.post("/chat")
def chat(request: ChatRequest):

    response = chatbot(
        message=request.message,
        history=request.history
    )

    return {
        "reply": response
    }


# ============================================================
# Disease recognizer API
# ============================================================

@app.post("/disease-recognizer")
async def disease_recognizer(image: UploadFile = File(...)):

    if image.content_type != "image/jpeg":
        raise HTTPException(
            status_code=415,
            detail="Upload a JPEG image to use the disease recognizer.",
        )

    image_bytes = await image.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="The image must be 10 MB or smaller.")
    if not image_bytes.startswith(b"\xff\xd8\xff"):
        raise HTTPException(status_code=400, detail="The uploaded file is not a valid JPEG image.")

    try:
        from brain_of_the_doctor import analyze_image_with_query

        response = analyze_image_with_query(
            query=(
                "Describe visible findings in this image and possible explanations. "
                "Do not diagnose or claim certainty. Explain that image-based "
                "assessment is limited and recommend professional medical care "
                "for concerning symptoms."
            ),
            model="openai/gpt-4o-mini",
            encoded_image=base64.b64encode(image_bytes).decode("ascii"),
        )
    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail="The image analysis service is unavailable. Please try again later.",
        ) from error

    return {
        "reply": response,
        "disclaimer": "Image analysis is informational only and is not a medical diagnosis.",
    }


# ============================================================
# Test
# ============================================================

@app.get("/")
def home():

    return {
        "message": "Smart Doctor API is running"
    }


if __name__ == "__main__":
    uvicorn.run("answer:app", host="0.0.0.0", port=8000, reload=True)