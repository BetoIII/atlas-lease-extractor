import chromadb
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.core import StorageContext

# Load your documents
documents = SimpleDirectoryReader('./uploaded_documents').load_data()

# Initialize Chroma client and collection
db = chromadb.PersistentClient(path="./chroma_db")
chroma_collection = db.get_or_create_collection("quickstart")

# Assign Chroma as the vector store
vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
storage_context = StorageContext.from_defaults(vector_store=vector_store)

# Create your index
index = VectorStoreIndex.from_documents(
    documents, storage_context=storage_context
)

# Persist the index (and vector store) to disk
index.storage_context.persist(persist_dir="./persist_dir")
