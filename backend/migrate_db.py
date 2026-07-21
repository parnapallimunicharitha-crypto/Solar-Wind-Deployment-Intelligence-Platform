from sqlalchemy import text
from app.database.database import engine, Base, SessionLocal
from app.models.user import User
from app.models.project import Project
from app.models.site import Site
from app.models.feature import Feature
from app.models.report import Report
from app.models.assessment import Assessment
from app.models.environmental_data import EnvironmentalData
from app.models.solar_prediction import SolarPrediction
from app.models.wind_prediction import WindPrediction
from app.models.feature_store import FeatureStore
from app.auth.auth_handler import get_password_hash
from app.feature_engineering.feature_builder import FeatureBuilder
import json

def migrate():
    with engine.connect() as conn:
        print("Ensuring users table columns are up to date...")
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);"))
            conn.commit()
            print("Successfully checked users table.")
        except Exception as e:
            print(f"Users table migration failed: {e}")

        print("Dropping old tables to fix schema alignment (projects, sites, features, reports, assessments, feature_store)...")
        try:
            conn.execute(text("DROP TABLE IF EXISTS assessments CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS feature_store CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS environmental_data CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS solar_predictions CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS wind_predictions CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS reports CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS features CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS sites CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS projects CASCADE;"))
            conn.commit()
            print("Successfully dropped mismatched tables.")
        except Exception as e:
            print(f"Drop tables failed: {e}")

    print("Generating all database schemas...")
    Base.metadata.create_all(bind=engine)
    print("Database schemas created.")

    # Seeding sample data
    db = SessionLocal()
    try:
        # 1. Seed default user if not exists
        user = db.query(User).filter(User.username == "admin").first()
        if not user:
            print("Seeding default Administrator user...")
            user = User(
                username="admin",
                hashed_password=get_password_hash("admin123"),
                role="Administrator",
                email="admin@renewable-intelligence.com",
                full_name="Admin Director"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        planner = db.query(User).filter(User.username == "planner").first()
        if not planner:
            print("Seeding default Renewable Energy Planner user...")
            planner = User(
                username="planner",
                hashed_password=get_password_hash("planner123"),
                role="Renewable Energy Planner",
                email="planner@renewable-intelligence.com",
                full_name="Lead Planner"
            )
            db.add(planner)
            db.commit()
            db.refresh(planner)

        # 2. Seed default project
        project = db.query(Project).first()
        if not project:
            print("Seeding default projects...")
            project1 = Project(
                project_name="Rajasthan Solar Farm Phase 1",
                region="Jaipur, Rajasthan",
                description="Large scale grid-connected utility PV installation study.",
                status="Active",
                user_id=user.id
            )
            project2 = Project(
                project_name="Tamil Nadu Wind Corridor",
                region="Kanyakumari, Tamil Nadu",
                description="Onshore wind resource assessment and micro-siting study.",
                status="Active",
                user_id=user.id
            )
            db.add(project1)
            db.add(project2)
            db.commit()
            db.refresh(project1)
            project = project1

        # 3. Seed default site
        site = db.query(Site).first()
        if not site:
            print("Seeding default sites...")
            site1 = Site(
                latitude=26.9124,
                longitude=75.7873,
                elevation=431.0,
                land_area=150.0,
                region="Jaipur, Rajasthan",
                infrastructure="Near NH-48 highway, grid connection feasible within 12km",
                ownership="Government",
                project_id=project.id
            )
            site2 = Site(
                latitude=8.0883,
                longitude=77.5385,
                elevation=10.0,
                land_area=80.0,
                region="Kanyakumari, Tamil Nadu",
                infrastructure="Coastal access road, transmission lines 5km away",
                ownership="Private",
                project_id=project.id
            )
            db.add(site1)
            db.add(site2)
            db.commit()
            db.refresh(site1)
            site = site1

        # 4. Seed feature for the site
        feat = db.query(Feature).first()
        if not feat:
            print("Seeding default features...")
            builder = FeatureBuilder()
            feats = builder.build_features(site.latitude, site.longitude)
            feature_record = Feature(
                latitude=site.latitude,
                longitude=site.longitude,
                solar_irradiance=feats.get("solar_irradiance"),
                wind_speed=feats.get("wind_speed"),
                temperature=feats.get("temperature"),
                humidity=feats.get("humidity"),
                elevation=feats.get("elevation") or site.elevation,
                slope=feats.get("slope") or 1.5,
                road_distance=feats.get("road_distance") or 2.1,
                substation_distance=feats.get("substation_distance") or 8.4,
                capacity_factor=feats.get("capacity_factor") or 18.5,
                wind_class=feats.get("wind_class") or "Moderate",
                terrain_score=feats.get("terrain_score") or 82.0,
                accessibility_score=feats.get("accessibility_score") or 78.0,
                site_id=site.id
            )
            db.add(feature_record)
            
            # Seed FeatureStore table too
            fs_record = FeatureStore(
                latitude=site.latitude,
                longitude=site.longitude,
                solar_irradiance=feats.get("solar_irradiance"),
                wind_speed=feats.get("wind_speed"),
                elevation=feats.get("elevation") or site.elevation,
                temperature=feats.get("temperature"),
                humidity=feats.get("humidity"),
                slope=feats.get("slope") or 1.5,
                road_distance=feats.get("road_distance") or 2.1,
                substation_distance=feats.get("substation_distance") or 8.4,
                suitability_score=80.0,
                site_id=site.id
            )
            db.add(fs_record)
            db.commit()

        print("Seeding completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
