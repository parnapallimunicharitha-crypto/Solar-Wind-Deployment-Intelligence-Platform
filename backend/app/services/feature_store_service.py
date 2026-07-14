from sqlalchemy.orm import Session

from app.models.feature import Feature


class FeatureStoreService:

    def save_feature(self, db: Session, feature: Feature):

        db.add(feature)
        db.commit()
        db.refresh(feature)

        return feature


    def get_all_features(self, db: Session):

        return db.query(Feature).all()


    def get_feature_by_id(self, db: Session, feature_id: int):

        return db.query(Feature).filter(
            Feature.id == feature_id
        ).first()


    def get_feature_by_location(self, db: Session, latitude: float, longitude: float):

        return db.query(Feature).filter(

            Feature.latitude == latitude,

            Feature.longitude == longitude

        ).first()