import types
import os
import json
import pytest

import risk_flags.risk_flags_query_pipeline as q


def _make_engine_with_text(text: str):
    class DummyStreamingResp:
        def __init__(self, t):
            self.response_gen = [t]
    class DummyIndex:
        def as_query_engine(self, streaming=True):
            class QE:
                def query(self_inner, prompt):
                    return DummyStreamingResp(text)
            return QE()
    return DummyIndex()


def test_parsing_multiple_sections(monkeypatch, tmp_path):
    # Force LLAMA_PARSE unavailable to skip API call noise
    monkeypatch.setattr(q, 'LLAMA_PARSE_AVAILABLE', False, raising=False)
    # Monkeypatch to bypass document loading and index creation
    monkeypatch.setattr(q, 'SimpleDirectoryReader', lambda input_files: types.SimpleNamespace(load_data=lambda: [types.SimpleNamespace(text='doc')]))

    # Ensure the code path loads an existing index instead of creating one
    original_exists = os.path.exists
    def fake_exists(path):
        if isinstance(path, str) and os.path.basename(path).startswith('storage_'):
            return True
        return original_exists(path)
    monkeypatch.setattr(os.path, 'exists', fake_exists)

    class DummyIndexForCreate:
        def __init__(self):
            self.storage_context = types.SimpleNamespace(persist=lambda *_: None)
        def set_index_id(self, *a, **k):
            pass
        def as_query_engine(self, streaming=True):
            class QE:
                def query(self_inner, prompt):
                    return None
            return QE()

    monkeypatch.setattr(q, 'VectorStoreIndex', types.SimpleNamespace(from_documents=lambda docs: DummyIndexForCreate()))
    monkeypatch.setattr(q, 'StorageContext', types.SimpleNamespace(from_defaults=lambda persist_dir: types.SimpleNamespace()))

    text = (
        "Early Termination Clause\nTenant may terminate.\n\n"
        "Uncapped Operating Expenses\nTenant pays all."
    )
    monkeypatch.setattr(q, 'load_index_from_storage', lambda *a, **k: _make_engine_with_text(text))

    f = tmp_path / "a.txt"
    f.write_text("hello")

    result = q.extract_risk_flags(str(f))
    assert 'risk_flags' in result
    assert len(result['risk_flags']) >= 2
    cats = [rf['category'] for rf in result['risk_flags']]
    assert 'Early Termination Clause' in cats


def test_parsing_fallback(monkeypatch, tmp_path):
    monkeypatch.setattr(q, 'LLAMA_PARSE_AVAILABLE', False, raising=False)
    monkeypatch.setattr(q, 'SimpleDirectoryReader', lambda input_files: types.SimpleNamespace(load_data=lambda: [types.SimpleNamespace(text='doc')]))
    class BadIndex:
        def as_query_engine(self, streaming=True):
            class QE:
                def query(self_inner, prompt):
                    raise Exception('query fail')
            return QE()
    monkeypatch.setattr(q, 'VectorStoreIndex', types.SimpleNamespace(from_documents=lambda docs: BadIndex()))

    f = tmp_path / "a.txt"
    f.write_text("hello")

    result = q.extract_risk_flags(str(f))
    assert result == {"risk_flags": []}
