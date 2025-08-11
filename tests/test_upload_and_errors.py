import io
import json
import os
import pytest


def test_upload_success(client, sample_text_file):
    with open(sample_text_file, 'rb') as f:
        data = {"file": (io.BytesIO(f.read()), os.path.basename(sample_text_file))}
        resp = client.post('/upload', data=data, content_type='multipart/form-data')
    assert resp.status_code == 200
    body = json.loads(resp.get_data(as_text=True))
    assert body["status"] == "success"
    assert body["filename"] == os.path.basename(sample_text_file)


def test_upload_missing_and_empty(client):
    resp = client.post('/upload')
    assert resp.status_code == 400
    body = json.loads(resp.get_data(as_text=True))
    assert body["error"].startswith("No file part")
    resp2 = client.post('/upload', data={"file": (io.BytesIO(b""), "")}, content_type='multipart/form-data')
    assert resp2.status_code == 400


def test_index_endpoint_success_with_mock(client, sample_text_file, mock_index_server):
    # Provide JSON with file_path
    payload = {"file_path": sample_text_file}
    resp = client.post('/index', json=payload)
    assert resp.status_code == 200


def test_index_endpoint_missing_file_path(client):
    resp = client.post('/index', json={})
    assert resp.status_code == 400


def test_index_endpoint_file_not_found(client):
    resp = client.post('/index', json={"file_path": "/not/found.pdf"})
    assert resp.status_code == 404


def test_query_endpoint_success(client):
    # Monkeypatch the global index object used by /query
    import flask_server as fs
    class DummyRetriever:
        def retrieve(self, q):
            return ["node1"]
    class DummyEngine:
        def query(self, q):
            return "ok"
    fs.index = type("Idx", (), {"as_retriever": lambda self=None: DummyRetriever(), "as_query_engine": lambda self=None: DummyEngine()})()

    resp = client.get('/query?text=hello')
    assert resp.status_code == 200
    body = json.loads(resp.get_data(as_text=True))
    assert body["response"] == "ok"
    assert body["retrieved_nodes"] == ["node1"]


def test_query_endpoint_missing_text(client):
    resp = client.get('/query')
    assert resp.status_code == 400


def test_sync_user_endpoint(client):
    payload = {"user_id": "u42", "email": "u42@example.com", "name": "U 42"}
    resp = client.post('/sync-user', data=json.dumps(payload), content_type='application/json')
    assert resp.status_code == 200
    body = json.loads(resp.get_data(as_text=True))
    assert body["status"] == "success"
    assert body["user"]["id"] == "u42"


def test_sync_user_endpoint_missing_fields(client):
    resp = client.post('/sync-user', data=json.dumps({}), content_type='application/json')
    assert resp.status_code == 400