import json
import io
import os
import pytest

# Targets streaming endpoints in flask_server.py

@pytest.mark.parametrize("method", ["GET", "POST"])
def test_stream_lease_flags_pipeline_happy_path(client, sample_text_file, method):
    if method == "GET":
        resp = client.get(f"/stream-lease-flags-pipeline?filename={os.path.basename(sample_text_file)}")
    else:
        with open(sample_text_file, "rb") as f:
            data = {"file": (io.BytesIO(f.read()), os.path.basename(sample_text_file))}
            resp = client.post("/stream-lease-flags-pipeline", data=data, content_type='multipart/form-data')
    assert resp.status_code == 200
    assert resp.mimetype == "text/event-stream"
    # Read some of the stream to ensure correct event framing
    text = resp.get_data(as_text=True)
    assert "event: connected" in text
    assert "event: progress" in text
    assert ("event: complete" in text) or ("event: error" in text)


def test_stream_lease_flags_pipeline_missing_filename(client):
    resp = client.get("/stream-lease-flags-pipeline")
    # Should still be event-stream with error event
    assert resp.status_code == 200
    assert resp.mimetype == "text/event-stream"
    text = resp.get_data(as_text=True)
    assert "event: error" in text
    assert "No file specified" in text


def test_stream_lease_flags_pipeline_missing_file_on_get(client):
    resp = client.get("/stream-lease-flags-pipeline?filename=does-not-exist.txt")
    assert resp.status_code == 404
    body = json.loads(resp.get_data(as_text=True))
    assert body["error"].startswith("File not found")


def test_stream_risk_flags_plain_sse_with_filename(client, sample_text_file):
    data = {"filename": os.path.basename(sample_text_file)}
    resp = client.post("/stream-risk-flags", data=json.dumps(data), content_type="application/json")
    assert resp.status_code == 200
    assert resp.mimetype == "text/event-stream"
    text = resp.get_data(as_text=True)
    assert "data: " in text
    assert "\n\n" in text
    assert "is_complete" in text


def test_stream_risk_flags_plain_sse_no_filename(client):
    resp = client.post("/stream-risk-flags", data=json.dumps({}), content_type="application/json")
    assert resp.status_code == 200
    text = resp.get_data(as_text=True)
    assert "error" in text
    assert "No filename provided" in text


def test_deprecated_stream_endpoints(client):
    resp = client.post("/stream-lease-flags")
    assert resp.status_code == 410
    data = json.loads(resp.get_data(as_text=True))
    assert data["error"].startswith("Deprecated")
    resp2 = client.post("/stream-lease-flags-sse")
    assert resp2.status_code == 410