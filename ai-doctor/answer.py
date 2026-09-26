import base64
import os
from pathlib import Path
from tempfile import TemporaryDirectory

import uvicorn
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool

from gradio_app import process_inputs_for_api


app = FastAPI(title="AI Doctor API")
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

MAX_UPLOAD_SIZE = 10 * 1024 * 1024


@app.get("/")
def home():
    return {"message": "AI Doctor API is running"}


@app.post("/disease-recognizer")
async def disease_recognizer(
    image: UploadFile = File(...),
    audio: UploadFile | None = File(default=None),
):
    if image.content_type != "image/jpeg":
        raise HTTPException(status_code=415, detail="Upload a JPEG image.")

    image_bytes = await image.read(MAX_UPLOAD_SIZE + 1)
    if len(image_bytes) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="The image must be 10 MB or smaller.")
    if not image_bytes.startswith(b"\xff\xd8\xff"):
        raise HTTPException(status_code=400, detail="The uploaded file is not a valid JPEG image.")

    audio_bytes = None
    audio_suffix = ".wav"
    if audio is not None:
        audio_bytes = await audio.read(MAX_UPLOAD_SIZE + 1)
        if len(audio_bytes) > MAX_UPLOAD_SIZE:
            raise HTTPException(status_code=413, detail="The audio must be 10 MB or smaller.")
        if not audio_bytes:
            raise HTTPException(status_code=400, detail="The uploaded audio is empty.")

        audio_suffix = Path(audio.filename or "").suffix.lower()
        if audio_suffix not in {".wav", ".mp3", ".m4a", ".webm", ".ogg", ".mp4"}:
            audio_suffix = {
                "audio/wav": ".wav",
                "audio/x-wav": ".wav",
                "audio/mpeg": ".mp3",
                "audio/mp4": ".m4a",
                "audio/webm": ".webm",
                "audio/ogg": ".ogg",
            }.get(audio.content_type, ".wav")

    try:
        with TemporaryDirectory() as temporary_directory:
            temporary_path = Path(temporary_directory)
            image_path = temporary_path / "upload.jpg"
            image_path.write_bytes(image_bytes)

            audio_path = None
            if audio_bytes is not None:
                audio_path = temporary_path / f"question{audio_suffix}"
                audio_path.write_bytes(audio_bytes)

            output_path = temporary_path / "response.wav"
            transcript, reply, audio_path = await run_in_threadpool(
                process_inputs_for_api,
                str(audio_path) if audio_path else None,
                str(image_path),
                str(output_path),
            )
            encoded_audio = base64.b64encode(Path(audio_path).read_bytes()).decode("ascii")
    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail="The AI Doctor analysis service is unavailable. Please try again later.",
        ) from error

    return {
        "transcript": transcript,
        "reply": reply,
        "audio_base64": encoded_audio,
        "audio_content_type": "audio/wav",
        "disclaimer": "This information is not a medical diagnosis. Consult a healthcare professional for medical advice.",
    }


if __name__ == "__main__":
    uvicorn.run("answer:app", host="0.0.0.0", port=8001, reload=True)
