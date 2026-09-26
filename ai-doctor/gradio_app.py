# pyrefly: ignore [missing-import]
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

#VoiceBot UI with Gradio
import os
import gradio as gr

from brain_of_the_doctor import encode_image, analyze_image_with_query
from voice_of_the_patient import record_audio, transcribe_audio
from voice_of_the_doctor import text_to_speech_with_openrouter

OPENROUTER_API_KEY=os.environ.get("OPENROUTER_API_KEY")

system_prompt="""You are an AI assistant providing general health information, not a doctor.
Describe only visible findings and possible explanations. Do not diagnose or claim certainty.
Explain that image-based assessment is limited and recommend professional medical care
for concerning symptoms. Keep the response concise and understandable."""


def process_inputs_for_api(audio_filepath, image_filepath, output_filepath):
    speech_to_text_output = ""
    if audio_filepath:
        speech_to_text_output = transcribe_audio(
            OPENROUTER_API_KEY=OPENROUTER_API_KEY,
            audio_filepath=audio_filepath,
            stt_model="openai/whisper-large-v3"
        )

    # Handle the image input
    if image_filepath:
        doctor_response = analyze_image_with_query(
            query=system_prompt+speech_to_text_output, 
            encoded_image=encode_image(image_filepath), 
            model="openai/gpt-4o-mini"
        )
    else:
        doctor_response = "No image provided for me to analyze"

    output_audio_path = text_to_speech_with_openrouter(
        input_text=doctor_response, 
        output_filepath=output_filepath
    )

    return speech_to_text_output, doctor_response, output_audio_path


def process_inputs(audio_filepath, image_filepath):
    return process_inputs_for_api(audio_filepath, image_filepath, "final.wav")


# Create the interface
iface = gr.Interface(
    fn=process_inputs,
    inputs=[
        gr.Audio(sources=["microphone"], type="filepath"),
        gr.Image(type="filepath")
    ],
    outputs=[
        gr.Textbox(label="Speech to Text"),
        gr.Textbox(label="Doctor's Response"),
        gr.Audio(label="Doctor's Voice", type="filepath")
    ],
    title="AI Doctor with Vision and Voice"
)

if __name__ == "__main__":
    iface.launch(debug=True)

#http://127.0.0.1:7860