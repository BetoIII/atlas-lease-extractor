from llama_index.core import VectorStoreIndex, Document
from llama_index.embeddings.openai import OpenAIEmbedding
import os

class VectorStoreManager:
    def __init__(self, persist_dir="vector_store"):
        self.persist_dir = persist_dir
        self.embedding = OpenAIEmbedding()  # You can swap this for another embedding model if needed
        self.index = self._load_or_create_index()

    def _load_or_create_index(self):
        if os.path.exists(self.persist_dir):
            return VectorStoreIndex.load(self.persist_dir, embedding=self.embedding)
        else:
            return VectorStoreIndex([], embedding=self.embedding)

    def add_documents(self, documents):
        self.index.add_documents(documents)
        self.index.save(self.persist_dir)

    def query(self, query_text, top_k=5):
        return self.index.query(query_text, top_k=top_k) 