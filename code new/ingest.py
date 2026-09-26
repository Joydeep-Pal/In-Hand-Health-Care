from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_core.embeddings import Embeddings
from openai import OpenAI
import os
from dotenv import load_dotenv
load_dotenv()


OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

openai_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY
)


class OpenRouterEmbeddings(Embeddings):

    def embed_documents(self, texts):
        embeddings = []
        batch_size = 50
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            response = openai_client.embeddings.create(
                model="openai/text-embedding-3-small",
                input=batch
            )
            embeddings.extend([item.embedding for item in response.data])
        return embeddings

    def embed_query(self, text):
        return self.embed_documents([text])[0]


DATA_PATH = os.path.join(os.path.dirname(__file__), "Knowledge_Base")


def load_pdf_files(data):
    loader = DirectoryLoader(
        data,
        glob="*.pdf",
        loader_cls=PyPDFLoader
    )

    documents = loader.load()
    return documents


documents = load_pdf_files(data=DATA_PATH)
print("Length of PDF pages:", len(documents))

if not documents:
    raise ValueError(f"No PDF files found in {DATA_PATH}")


# Step 2: Create Chunks
def create_chunks(extracted_data):

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )

    text_chunks = text_splitter.split_documents(extracted_data)

    return text_chunks


text_chunks = create_chunks(extracted_data=documents)

#print("Length of Text Chunks: ", len(text_chunks))


# Step 3: Create Vector Embeddings

def get_embedding_model():
    return OpenRouterEmbeddings()


embedding_model = get_embedding_model()


# Step 4: Store embeddings in Chroma

CHROMA_PATH = os.path.join(os.path.dirname(__file__), "vectorstore", "chroma_db")

db = Chroma.from_documents(
    documents=text_chunks,
    embedding=embedding_model,
    persist_directory=CHROMA_PATH
)

print("Chroma database created successfully!")