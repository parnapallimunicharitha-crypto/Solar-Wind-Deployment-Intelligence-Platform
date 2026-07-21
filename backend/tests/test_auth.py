"""
pytest tests for Authentication endpoints (register, login, profile, users).
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# ── Helpers ──────────────────────────────────────────────────────────────────

def register_and_login(username: str, password: str, role: str = "Renewable Energy Planner"):
    """Register a user and return the JWT token."""
    client.post("/auth/register", json={"username": username, "password": password, "role": role})
    resp = client.post(
        "/auth/login",
        data={"username": username, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    return resp.json().get("access_token", "")


# ── Registration ──────────────────────────────────────────────────────────────

class TestRegister:
    def test_register_success(self):
        resp = client.post(
            "/auth/register",
            json={"username": "test_reg_user", "password": "pass1234", "role": "GIS Analyst"}
        )
        # 201 or 400 if already registered
        assert resp.status_code in (201, 400)

    def test_register_duplicate(self):
        payload = {"username": "dup_user_test", "password": "pass1234"}
        client.post("/auth/register", json=payload)
        resp = client.post("/auth/register", json=payload)
        assert resp.status_code == 400
        assert "already registered" in resp.json()["detail"].lower()

    def test_register_short_password(self):
        resp = client.post("/auth/register", json={"username": "shortpw", "password": "ab"})
        assert resp.status_code == 422  # Pydantic validation

    def test_register_default_role(self):
        resp = client.post(
            "/auth/register",
            json={"username": "default_role_u", "password": "pass1234"}
        )
        if resp.status_code == 201:
            assert resp.json()["role"] == "Renewable Energy Planner"


# ── Login ─────────────────────────────────────────────────────────────────────

class TestLogin:
    def test_login_success(self):
        client.post("/auth/register", json={"username": "login_user", "password": "testpass"})
        resp = client.post(
            "/auth/login",
            data={"username": "login_user", "password": "testpass"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "role" in data

    def test_login_wrong_password(self):
        client.post("/auth/register", json={"username": "wrongpw_user", "password": "correct"})
        resp = client.post(
            "/auth/login",
            data={"username": "wrongpw_user", "password": "wrongpassword"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert resp.status_code == 401

    def test_login_nonexistent_user(self):
        resp = client.post(
            "/auth/login",
            data={"username": "nobody_here", "password": "irrelevant"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert resp.status_code == 401


# ── Profile ───────────────────────────────────────────────────────────────────

class TestProfile:
    def test_profile_authenticated(self):
        token = register_and_login("profile_user", "pass1234")
        resp = client.get("/auth/profile", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["username"] == "profile_user"
        assert "role" in data
        assert "id" in data

    def test_profile_unauthenticated(self):
        resp = client.get("/auth/profile")
        assert resp.status_code == 401

    def test_users_list_authenticated(self):
        token = register_and_login("users_list_u", "pass1234")
        resp = client.get("/auth/users", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
