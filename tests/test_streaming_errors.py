import json
import io


def test_stream_pipeline_error_propagation(client, sample_text_file, mocker):
    # Force pipeline to raise inside generator
    import flask_server as fs
    mocker.patch.object(fs, 'extract_risk_flags_pipeline', side_effect=Exception('boom'))

    with open(sample_text_file, 'rb') as f:
        data = {"file": (io.BytesIO(f.read()), 'x.txt')}
        resp = client.post('/stream-lease-flags-pipeline', data=data, content_type='multipart/form-data')
    assert resp.status_code == 200
    text = resp.get_data(as_text=True)
    assert 'event: error' in text
    assert 'boom' in text


def test_stream_risk_flags_missing_file_error(client):
    resp = client.post('/stream-risk-flags', data=json.dumps({"filename": "nope.txt"}), content_type='application/json')
    assert resp.status_code == 200
    text = resp.get_data(as_text=True)
    assert 'File not found' in text


