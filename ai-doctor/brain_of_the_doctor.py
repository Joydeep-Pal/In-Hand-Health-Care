# pyrefly: ignore [missing-import]
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

#Step1: Setup OpenRouter API key
import os

OPENROUTER_API_KEY=os.environ.get("OPENROUTER_API_KEY")
OPENROUTER_BASEURL=os.environ.get("OPENROUTER_BASEURL")

#Step2: Convert image to required format
import base64


#image_path="acne.jpg"

def encode_image(image_path):   
    image_file=open(image_path, "rb")
    return base64.b64encode(image_file.read()).decode('utf-8')

#Step3: Setup Multimodal LLM (GPT-4o Mini via OpenRouter)
from openai import OpenAI

query="Is there something wrong with my face?"
model="openai/gpt-4o-mini"

def analyze_image_with_query(query, model, encoded_image):
    client=OpenAI(
        base_url=OPENROUTER_BASEURL,
        api_key=OPENROUTER_API_KEY
    )
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "text", 
                    "text": query
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{encoded_image}",
                    },
                },
            ],
        }]
    chat_completion=client.chat.completions.create(
        messages=messages,
        model=model
    )

    return chat_completion.choices[0].message.content
