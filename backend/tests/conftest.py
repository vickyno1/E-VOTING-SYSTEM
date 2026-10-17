import pytest
import datetime
import mongomock
from app import extensions as app_extensions
from app import create_app
from app.config import Config
from app.extensions import init_db_indexes

class TestConfig(Config):
    TESTING = True
    FLASK_ENV = "testing"
    SECRET_KEY = "test_secret_key_1234567890_test_key"
    MONGODB_DATABASE = "evoting_test_db"
    FACE_SIMILARITY_THRESHOLD = 0.363

@pytest.fixture(autouse=True)
def mock_db(monkeypatch):
    """
    In-memory MongoDB mock client with full indexing support for fast, isolated tests.
    Resets for every single test.
    """
    client = mongomock.MongoClient()
    db = client[TestConfig.MONGODB_DATABASE]

    # Clear cached global db in extensions
    app_extensions._db = db
    app_extensions._mongo_client = client

    monkeypatch.setattr(app_extensions, "get_mongo_client", lambda: client)
    monkeypatch.setattr(app_extensions, "get_db", lambda client_arg=None: db)
    
    init_db_indexes(db)
    yield db

    # Cleanup after test
    app_extensions._db = None
    app_extensions._mongo_client = None

@pytest.fixture
def app(mock_db):
    test_app = create_app(TestConfig)
    return test_app

@pytest.fixture
def client(app):
    return app.test_client()
