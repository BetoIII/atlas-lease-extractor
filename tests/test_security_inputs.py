import io
import json
import os


def test_upload_rejects_path_traversal(client):
    # Filename sanitized by secure_filename; path traversal should not be used as filename
    data = {"file": (io.BytesIO(b"hello"), "../../etc/passwd")}
    resp = client.post('/upload', data=data, content_type='multipart/form-data')
    # Even if saved, name should be stripped to 'etc_passwd' or similar
    assert resp.status_code == 200
    body = json.loads(resp.get_data(as_text=True))
    assert ".." not in body.get("filename", "")
    assert "/" not in body.get("filename", "")


def test_index_rejects_missing_or_invalid_path(client):
    # Missing path
    resp = client.post('/index', json={})
    assert resp.status_code == 400
    # Nonexistent path
    resp2 = client.post('/index', json={"file_path": "/nope/../../tmp/doesnotexist.pdf"})
    assert resp2.status_code == 404


def test_query_requires_text_param(client):
    resp = client.get('/query')
    assert resp.status_code == 400


def test_stream_risk_flags_rejects_missing_filename(client):
    resp = client.post('/stream-risk-flags', data=json.dumps({}), content_type='application/json')
    assert resp.status_code == 200
    text = resp.get_data(as_text=True)
    assert "No filename provided" in text


