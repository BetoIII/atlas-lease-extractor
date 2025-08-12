import importlib
import os
import sys


def test_index_server_key_prod_requires_env(monkeypatch):
    # Simulate production env (common env var names)
    monkeypatch.setenv('FLASK_ENV', 'production')
    monkeypatch.setenv('ENV', 'production')
    monkeypatch.setenv('NODE_ENV', 'production')
    monkeypatch.delenv('INDEX_SERVER_KEY', raising=False)

    # Reload module fresh
    if 'flask_server' in sys.modules:
        del sys.modules['flask_server']
    try:
        # Import the module but fetch validation function directly to avoid thread startup side effects
        fs = importlib.import_module('flask_server')
        # Explicitly validate with production override
        fs.validate_index_server_key(None, env_override='production')
        assert False, "Expected RuntimeError for missing INDEX_SERVER_KEY in prod"
    except RuntimeError as e:
        assert 'INDEX_SERVER_KEY is required' in str(e)


def test_index_server_key_dev_generates_ephemeral(monkeypatch):
    monkeypatch.setenv('FLASK_ENV', 'development')
    monkeypatch.delenv('INDEX_SERVER_KEY', raising=False)

    if 'flask_server' in sys.modules:
        del sys.modules['flask_server']
    fs = importlib.import_module('flask_server')
    assert isinstance(fs.INDEX_SERVER_KEY, (bytes, bytearray)) and len(fs.INDEX_SERVER_KEY) >= 16


