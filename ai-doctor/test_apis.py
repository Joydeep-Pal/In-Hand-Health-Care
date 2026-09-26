"""Quick test to check which API calls work via OpenRouter."""
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

import os
from openai import OpenAI

client = OpenAI(
    base_url=os.environ.get("OPENROUTER_BASEURL"),
    api_key=os.environ.get("OPENROUTER_API_KEY")
)

# Test 1: LLM
print("--- Test 1: LLM (gpt-4o-mini) ---")
try:
    r = client.chat.completions.create(
        model="openai/gpt-4o-mini",
        messages=[{"role": "user", "content": "say hi"}],
        max_tokens=5
    )
    print(f"  OK: {r.choices[0].message.content}")
except Exception as e:
    print(f"  FAILED: {e}")

# Test 2: STT
print("\n--- Test 2: STT (whisper-large-v3) ---")
try:
    f = open("patient_voice_test.mp3", "rb")
    t = client.audio.transcriptions.create(
        model="openai/whisper-large-v3",
        file=f,
        language="en"
    )
    print(f"  OK: {t.text[:80]}")
except Exception as e:
    print(f"  FAILED: {e}")

# Test 3: TTS
print("\n--- Test 3: TTS (gemini-3.8-flash-lite-tts) ---")
try:
    response = client.audio.speech.create(
        model="google/gemini-3.8-flash-lite-tts",
        voice="Kore",
        input="Hello, this is a test of the AI doctor voice.",
        response_format="mp3"
    )
    response.stream_to_file("test_tts.mp3")
    print("  OK: saved test_tts.mp3")
except Exception as e:
    print(f"  FAILED: {e}")

print("\nDone!")
