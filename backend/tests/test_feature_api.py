from fastapi.testclient import TestClient
import pytest
from app.main import app
from app.database.database import SessionLocal, Base, engine
from app.models.user import User
from app.auth.auth_handler import get_password_hash

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    # Setup test tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Seed test administrator user
    test_user = db.query(User).filter(User.username == "testuser").first()
    if not test_user:
        hashed = get_password_hash("testpass")
        test_user = User(username="testuser", hashed_password=hashed, role="Administrator")
        db.add(test_user)
        db.commit()
    db.close()
    yield


def get_auth_headers():
    response = client.post(
        "/auth/login",
        data={"username": "testuser", "password": "testpass"}
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_feature_crud():
    headers = get_auth_headers()

    # Define a unique test coordinate to avoid duplicate record collisions
    lat, lon = 12.88, 56.99

    feature_data = {
        "latitude": lat,
        "longitude": lon,
        "solar_irradiance": 5.2,
        "wind_speed": 6.5,
        "temperature": 25.0,
        "humidity": 60.0,
        "elevation": 100.0,
        "slope": 4.5,
        "road_distance": 0.5,
        "substation_distance": 5.0,
        "capacity_factor": 35.0,
        "wind_class": "Good",
        "terrain_score": 85.0,
        "accessibility_score": 96.0
    }

    # 1. Create a feature
    response = client.post("/features/", json=feature_data, headers=headers)
    assert response.status_code in [201, 400]

    # 2. Get all features
    response = client.get("/features/", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) > 0

    # 3. Get feature by location
    response = client.get(f"/features/location?latitude={lat}&longitude={lon}", headers=headers)
    assert response.status_code == 200
    assert response.json()["latitude"] == lat
