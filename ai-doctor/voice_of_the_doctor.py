# pyrefly: ignore [missing-import]
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

#Step1: Setup Text to Speech–TTS–via OpenRouter (Gemini 3.8 Flash Lite TTS)
import os
import wave
import subprocess
import platform
from openai import OpenAI

OPENROUTER_API_KEY=os.environ.get("OPENROUTER_API_KEY")
OPENROUTER_BASEURL=os.environ.get("OPENROUTER_BASEURL")

def text_to_speech_with_openrouter(input_text, output_filepath):
    """Generate speech using Gemini 3.8 Flash Lite TTS via OpenRouter and save to file."""
    client=OpenAI(
        base_url=OPENROUTER_BASEURL,
        api_key=OPENROUTER_API_KEY
    )
    response=client.audio.speech.create(
        model="google/gemini-3.8-flash-lite-tts",
        voice="Kore",
        input=input_text,
        response_format="pcm"
    )

    # Gemini TTS returns raw PCM (24kHz, 16-bit, mono) — convert to WAV
    wav_filepath = output_filepath.rsplit(".", 1)[0] + ".wav"
    with wave.open(wav_filepath, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)  # 16-bit = 2 bytes
        wav_file.setframerate(24000)
        wav_file.writeframes(response.content)
    return wav_filepath


#Step2: Version with auto-play (for standalone use, not Gradio)
def text_to_speech_with_autoplay(input_text, output_filepath):
    """Generate speech and auto-play it locally."""
    text_to_speech_with_openrouter(input_text, output_filepath)
    os_name = platform.system()
    try:
        if os_name == "Darwin":  # macOS
            subprocess.run(['afplay', output_filepath])
        elif os_name == "Windows":  # Windows
            subprocess.run(['powershell', '-c', f'(New-Object Media.SoundPlayer "{output_filepath}").PlaySync();'])
        elif os_name == "Linux":  # Linux
            subprocess.run(['aplay', output_filepath])  # Alternative: use 'mpg123' or 'ffplay'
        else:
            raise OSError("Unsupported operating system")
    except Exception as e:
        print(f"An error occurred while trying to play the audio: {e}")
    return output_filepath


if __name__ == "__main__":
    input_text="Hi this is the AI Doctor, testing audio!"
    text_to_speech_with_autoplay(input_text=input_text, output_filepath="tts_testing_autoplay.mp3")