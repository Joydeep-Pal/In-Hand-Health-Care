import openai

from chatbot import chatbot


class DummyRetriever:
    def invoke(self, query):
        return [type("Doc", (), {"page_content": "Fever and headache can be from viral illness."})()]


def test_chatbot_handles_api_connection_error(monkeypatch):
    monkeypatch.setattr("chatbot.retriever", DummyRetriever())

    def fake_create(*args, **kwargs):
        raise openai.APIConnectionError(request=None)

    monkeypatch.setattr("chatbot.client.chat.completions.create", fake_create)

    result = chatbot(message="I have fever and headache", history=[])

    assert "unable to reach" in result.lower()
    assert "medical answer service" in result.lower()