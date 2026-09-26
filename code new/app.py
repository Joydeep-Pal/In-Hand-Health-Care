import gradio as gr
from chatbot import chatbot


def respond(message, history):
    if not message or not message.strip():
        return "Please describe your symptoms so I can help."

    normalized_history = []

    for item in history or []:
        if isinstance(item, dict):
            normalized_history.append(item)
            continue

        if isinstance(item, (list, tuple)) and len(item) >= 2:
            user_msg, assistant_msg = item[0], item[1]
            if user_msg:
                normalized_history.append({"role": "user", "content": user_msg})
            if assistant_msg:
                normalized_history.append({"role": "assistant", "content": assistant_msg})

    response = chatbot(
        message=message,
        history=normalized_history
    )

    return response


demo = gr.ChatInterface(
    fn=respond,
    type="messages",
    title="In-Hand Health Care",
    description="An AI health information assistant. Describe your symptoms and get information.",
    examples=[
        "I have fever and headache since 2 days",
        "I have chest pain and difficulty breathing",
        "I have a sore throat and runny nose"
    ],
    theme=gr.themes.Soft()
)


if __name__ == "__main__":
    demo.launch()
