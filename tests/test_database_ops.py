import os
import pytest
from sqlalchemy.exc import OperationalError

import database as db


def test_create_document_generates_initial_activities(monkeypatch):
    # Ensure tables exist
    db.db_manager.create_tables()
    # Create test user
    session = db.db_manager.get_session()
    try:
        if not session.query(db.User).filter_by(id="u1").first():
            session.add(db.User(id="u1", email="u1@example.com", name="U1"))
            session.commit()
    finally:
        session.close()

    document = db.db_manager.create_document({
        'title': 'Doc',
        'file_path': '/tmp/doc.pdf',
        'user_id': 'u1',
        'sharing_type': 'external',
        'shared_emails': ['a@b.com', 'c@d.com'],
        'license_fee': 123.0,
        'extracted_data': {},
        'risk_flags': []
    })

    activities = db.db_manager.get_document_activities(document.id)
    actions = [a.action for a in activities]
    # Must include REGISTER_ASSET and DECLARE_OWNER
    assert 'REGISTER_ASSET' in actions
    assert 'DECLARE_OWNER' in actions
    # external creates INVITE_PARTNER entries for each email
    assert actions.count('INVITE_PARTNER') == 2


def test_add_blockchain_activity_with_ledger_events(monkeypatch):
    db.db_manager.create_tables()
    # Ensure a user and document
    session = db.db_manager.get_session()
    try:
        user = session.query(db.User).filter_by(id="u2").first()
        if not user:
            user = db.User(id="u2", email="u2@example.com", name="U2")
            session.add(user)
            session.commit()
        doc = db.Document(
            title='Doc2', file_path='/tmp/doc2.pdf', user_id='u2', sharing_type='firm'
        )
        session.add(doc)
        session.commit()
        doc_id = doc.id
    finally:
        session.close()

    result = db.db_manager.add_blockchain_activity(doc_id, {
        'action': 'DATA_EXPORTED',
        'type': 'access',
        'actor': 'u2',
        'details': 'Exported CSV',
        'ledger_events': [{'event': 'DATA_EXPORTED', 'details': 'csv'}],
        'revenue_impact': 0.0
    })
    assert result['document_id'] == doc_id
    assert result['extra_data']['ledger_events'][0]['event'] == 'DATA_EXPORTED'


def test_add_blockchain_activity_retries(monkeypatch, capsys):
    # Monkeypatch SessionLocal to raise an OperationalError-like exception twice, then succeed
    original_get_session = db.db_manager.get_session
    call_count = {'n': 0}

    class FakeSession:
        def __init__(self):
            pass
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

    def flaky_get_session():
        call_count['n'] += 1
        if call_count['n'] < 3:
            # Raise connection-closed-like error on use
            class RaiseOnAdd(FakeSession):
                def add(self, *a, **k):
                    raise Exception('SSL connection has been closed')
            return RaiseOnAdd()
        return FakeSession()

    monkeypatch.setattr(db.db_manager, 'get_session', flaky_get_session)
    # Should retry twice, then succeed and return dict
    result = db.db_manager.add_blockchain_activity('docX', {
        'action': 'DATA_EXPORTED', 'type': 'access', 'actor': 'u', 'details': 'd'
    })
    captured = capsys.readouterr().out
    assert "retrying (1/3)" in captured
    assert "retrying (2/3)" in captured
    assert isinstance(result, dict)

    # Restore
    monkeypatch.setattr(db.db_manager, 'get_session', original_get_session)


def test_get_activity_ledger_events_missing_returns_empty():
    # Ensure tables exist
    db.db_manager.create_tables()
    events = db.db_manager.get_activity_ledger_events('nope')
    assert events == []


def test_sync_user_from_auth_create_update_conflict():
    db.db_manager.create_tables()
    # Create with email X
    user = db.db_manager.sync_user_from_auth('idA', 'mail@example.com', 'A')
    assert user.id == 'idA'
    # Update name
    user2 = db.db_manager.sync_user_from_auth('idA', 'mail@example.com', 'A2')
    assert user2.name == 'A2'
    # Create conflicting email with new ID → should reassign to new ID
    user3 = db.db_manager.sync_user_from_auth('idB', 'mail@example.com', 'B')
    assert user3.id == 'idB'
    assert user3.email == 'mail@example.com'
