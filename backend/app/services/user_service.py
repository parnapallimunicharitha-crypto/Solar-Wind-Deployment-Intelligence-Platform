from sqlalchemy.orm import Session
from app.models.user import User
from app.auth.auth_handler import get_password_hash


class UserService:
    """
    UserService encapsulating all query and write operations on the User database model.
    """

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> User:
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_user_by_username(db: Session, username: str) -> User:
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def get_all_users(db: Session) -> list[User]:
        return db.query(User).all()

    @staticmethod
    def create_user(db: Session, user_data) -> User:
        hashed_pw = get_password_hash(user_data.password)
        new_user = User(
            username=user_data.username,
            hashed_password=hashed_pw,
            role=user_data.role
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
