import threading
import time
import json


def test_add_blockchain_activity_concurrent(monkeypatch):
    # Exercise retry loop in quick succession by injecting transient failure
    import database as db

    original_get_session = db.db_manager.get_session
    call_count = {"n": 0}

    class FakeSession:
        def add(self, *a, **k):
            pass
        def commit(self):
            pass
        def refresh(self, *a, **k):
            pass
        def close(self):
            pass
        @property
        def rollback(self):
            return lambda: None

    def flaky_once():
        call_count["n"] += 1
        if call_count["n"] % 3 == 1:
            class RaiseOnAdd(FakeSession):
                def add(self, *a, **k):
                    raise Exception('server closed the connection')
            return RaiseOnAdd()
        return FakeSession()

    monkeypatch.setattr(db.db_manager, 'get_session', flaky_once)

    results = []

    def worker():
        try:
            res = db.db_manager.add_blockchain_activity('d1', {
                'action': 'DOCUMENT_VIEWED', 'type': 'access', 'actor': 'u', 'details': 'view'
            })
            results.append(res)
        except Exception as e:
            results.append({"error": str(e)})

    threads = [threading.Thread(target=worker) for _ in range(4)]
    for t in threads: t.start()
    for t in threads: t.join()

    assert len(results) == 4
    # Expect most to succeed; allow at most one error from overlapping retry windows
    errors = [r for r in results if 'error' in r]
    assert len(errors) <= 1


