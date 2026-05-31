from copy import deepcopy

import pytest
from fastapi.testclient import TestClient

from src.app import app, activities


@pytest.fixture()
def client():
    # Arrange: provide an HTTP client for each test.
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_activities_state():
    # Arrange: keep each test isolated from in-memory state mutations.
    original_state = deepcopy(activities)

    yield

    activities.clear()
    activities.update(deepcopy(original_state))