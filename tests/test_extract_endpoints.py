import io
import json
import os
import pytest


def test_extract_summary_happy_path(client, sample_text_file, mock_extractors):
    with open(sample_text_file, "rb") as f:
        data = {"file": (io.BytesIO(f.read()), os.path.basename(sample_text_file))}
        resp = client.post("/extract-summary", data=data, content_type='multipart/form-data')
    assert resp.status_code == 200
    body = json.loads(resp.get_data(as_text=True))
    assert body["status"] == "success"
    assert body["data"] == {"summary": True}
    assert body["sourceData"]["source"] == "test"


def test_extract_risk_flags_happy_path(client, sample_text_file, mock_extractors):
    with open(sample_text_file, "rb") as f:
        data = {"file": (io.BytesIO(f.read()), os.path.basename(sample_text_file))}
        resp = client.post("/extract-risk-flags", data=data, content_type='multipart/form-data')
    assert resp.status_code == 200
    body = json.loads(resp.get_data(as_text=True))
    assert body["status"] == "success"
    assert body["data"] == {"flags": True}


def test_extract_lease_all_happy_path(client, sample_text_file, mock_extractors):
    with open(sample_text_file, "rb") as f:
        data = {"file": (io.BytesIO(f.read()), os.path.basename(sample_text_file))}
        resp = client.post("/extract-lease-all", data=data, content_type='multipart/form-data')
    assert resp.status_code == 200
    body = json.loads(resp.get_data(as_text=True))
    assert body["status"] == "success"
    assert body["summary"]["data"] == {"summary": True}
    assert body["flags"]["data"] == {"flags": True}


@pytest.mark.parametrize("endpoint", ["/extract-summary", "/extract-risk-flags", "/extract-lease-all"])
def test_extract_endpoints_missing_file(client, endpoint):
    resp = client.post(endpoint)
    assert resp.status_code == 400
    body = json.loads(resp.get_data(as_text=True))
    assert body["error"].startswith("No file part")


def test_extract_endpoints_empty_filename(client):
    # Use a small buffer but empty filename to trigger validation path without closed file error
    for endpoint in ["/extract-summary", "/extract-risk-flags", "/extract-lease-all"]:
        data = {"file": (io.BytesIO(b"x"), "")}
        resp = client.post(endpoint, data=data, content_type='multipart/form-data')
        assert resp.status_code == 400
        body = json.loads(resp.get_data(as_text=True))
        assert body["error"].startswith("No selected file")
