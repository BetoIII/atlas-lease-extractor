import os
import types
import pytest

import rag_pipeline as rp


def test_rag_initialize_and_status(mocker, monkeypatch):
    # Replace LlamaCloudIndex with a lightweight dummy to avoid creating engines
    class DummyIndex:
        def as_retriever(self):
            return types.SimpleNamespace(retrieve=lambda q: [])
        def as_query_engine(self):
            return types.SimpleNamespace(query=lambda q: "")
    monkeypatch.setattr(rp, 'LlamaCloudIndex', lambda **kwargs: DummyIndex())

    pipeline = rp.RAGPipeline()
    assert pipeline.initialize_index() is True
    status = pipeline.get_status()
    assert status["initialized"] is True
    assert isinstance(status["connected"], bool)


def test_rag_handle_file_upload_success(mocker, monkeypatch, tmp_path):
    class DummyIndex:
        def as_retriever(self):
            return types.SimpleNamespace(retrieve=lambda q: [])
        def as_query_engine(self):
            return types.SimpleNamespace(query=lambda q: "")
    monkeypatch.setattr(rp, 'LlamaCloudIndex', lambda **kwargs: DummyIndex())

    pipeline = rp.RAGPipeline()
    # Create a directory with a dummy file
    d = tmp_path / "docs"
    d.mkdir()
    f = d / "a.txt"
    f.write_text("hello")

    # Mock client and pipeline internals safely
    pipeline.client = types.SimpleNamespace(pipelines=types.SimpleNamespace(upsert_batch_pipeline_documents=lambda *a, **k: None))
    monkeypatch.setattr(rp, 'SimpleDirectoryReader', lambda *a, **k: types.SimpleNamespace(load_data=lambda: [types.SimpleNamespace(to_cloud_document=lambda: {}, text="hi")]))

    # Wrap pipeline.run by replacing the whole IngestionPipeline with dummy
    pipeline.pipeline = types.SimpleNamespace(run=lambda **k: [1, 2])

    assert pipeline.handle_file_upload(str(f)) is True


def test_rag_handle_file_upload_failure(mocker):
    mocker.patch.object(rp, 'LlamaCloudIndex')
    pipeline = rp.RAGPipeline()
    # Make reader raise
    mocker.patch.object(rp, 'SimpleDirectoryReader', side_effect=Exception('boom'))
    assert pipeline.handle_file_upload("/nope/file.txt") is False


def test_rag_query_success(monkeypatch):
    class DummyRetriever:
        def retrieve(self, q):
            return ["n1"]
    class DummyQueryEngine:
        def query(self, q):
            return "answer"
    class DummyIndex:
        def as_retriever(self):
            return DummyRetriever()
        def as_query_engine(self):
            return DummyQueryEngine()
    monkeypatch.setattr(rp, 'LlamaCloudIndex', lambda **kwargs: DummyIndex())

    pipeline = rp.RAGPipeline()
    # Force initialized and set index directly
    pipeline.initialized = True
    pipeline.index = DummyIndex()
    assert pipeline.query_index("q") == "answer"


def test_rag_background_indexing_handles_missing_dir(capsys):
    pipeline = rp.RAGPipeline()
    pipeline.background_index_existing_documents()
    out = capsys.readouterr().out
    assert "Upload directory" in out or out == ""