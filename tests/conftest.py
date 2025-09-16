import os
import sys
import shutil
import tempfile
import contextlib
import types
import importlib
import pytest

# Pre-inject lightweight stubs to avoid external services during import time
# Stub llama_cloud_manager
if 'llama_cloud_manager' not in sys.modules:
    m = types.ModuleType('llama_cloud_manager')
    class _DummyRetriever:
        def retrieve(self, q):
            return []
    class _DummyEngine:
        def query(self, q):
            return ""
    class _DummyIndex:
        def as_retriever(self):
            return _DummyRetriever()
        def as_query_engine(self):
            return _DummyEngine()
    class LlamaCloudManager:
        FLAGS_AGENT_NAME = "TEST_FLAGS_AGENT"
        SUMMARY_AGENT_NAME = "TEST_SUMMARY_AGENT"
        def __init__(self):
            pass
        def get_index(self):
            return _DummyIndex()
    m.LlamaCloudManager = LlamaCloudManager
    sys.modules['llama_cloud_manager'] = m

# No need to stub OpenTelemetry packages since we're using llamatrace
# which is handled directly through llama_index.core

# Ensure a test-friendly env before importing flask_server or database.
# Use an isolated on-disk SQLite DB under the pytest temp directory when available
# to avoid interfering with any external configuration or in-memory cross-process visibility.
test_db_path = os.getenv("ATLAS_TEST_DB_PATH") or os.path.join(
    os.getenv("PYTEST_TMPDIR", "/tmp"), "atlas_test.sqlite"
)
os.environ.setdefault("DATABASE_URL", f"sqlite+pysqlite:///{test_db_path}")
os.environ.setdefault("OPENAI_API_KEY", "test-openai-key")
os.environ.setdefault("LLAMA_CLOUD_API_KEY", "test-llama-key")

# Reload database to pick up env before engine creation
import database as _db
importlib.reload(_db)

@pytest.fixture(autouse=True)
def mock_heavy_operations(mocker):
    # Mock heavy operations for faster tests
    yield

@pytest.fixture(scope="session")
def temp_upload_dir(tmp_path_factory):
    path = tmp_path_factory.mktemp("uploaded_documents")
    # Create structure expected by app
    os.makedirs(path, exist_ok=True)
    # Change CWD-based usage to point to this temp folder
    original_cwd = os.getcwd()
    os.chdir("/workspace") if os.path.exists("/workspace") else None
    # Monkeypatch via env var-like path if needed; code uses hardcoded folder name, so chdir to project root
    yield str(path)
    os.chdir(original_cwd)

@pytest.fixture()
def monkeypatch_upload_folder(monkeypatch, temp_upload_dir):
    # The app uses 'uploaded_documents' relative to CWD; symlink or ensure path exists
    if os.path.islink("uploaded_documents") or os.path.exists("uploaded_documents"):
        shutil.rmtree("uploaded_documents", ignore_errors=True)
    os.symlink(temp_upload_dir, "uploaded_documents")
    yield temp_upload_dir
    try:
        if os.path.islink("uploaded_documents"):
            os.unlink("uploaded_documents")
    except FileNotFoundError:
        pass

@pytest.fixture()
def flask_app(monkeypatch_upload_folder):
    # Import after upload dir wiring
    from flask_server import app
    app.config.update({
        "TESTING": True
    })
    return app

@pytest.fixture()
def client(flask_app):
    return flask_app.test_client()

@pytest.fixture()
def sample_text_file(monkeypatch_upload_folder, temp_upload_dir):
    file_path = os.path.join(temp_upload_dir, "sample_lease.txt")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write("Early Termination Clause\nTenant may terminate with 30 days notice.\n\nUncapped Operating Expenses\nTenant pays all operating expenses without cap.")
    return file_path

@pytest.fixture()
def mock_extractors(mocker):
    class DummyResult:
        def __init__(self, data):
            self.data = data
            self.extraction_metadata = {"source": "test"}
    mocker.patch("flask_server.LeaseSummaryExtractor", autospec=True)
    mocker.patch("flask_server.RiskFlagsExtractor", autospec=True)
    flask_server = __import__("flask_server")
    flask_server.LeaseSummaryExtractor.return_value.process_document.return_value = DummyResult({"summary": True})
    flask_server.RiskFlagsExtractor.return_value.process_document.return_value = DummyResult({"flags": True})
    return DummyResult

@pytest.fixture()
def mock_index_server(mocker):
    # Mock connect_to_index_server and manager.upload_file
    import flask_server as fs
    manager = types.SimpleNamespace(upload_file=mocker.Mock(return_value=True))
    mocker.patch.object(fs, "connect_to_index_server", return_value=manager)
    # Force global manager to this object
    fs.manager = manager
    return manager
