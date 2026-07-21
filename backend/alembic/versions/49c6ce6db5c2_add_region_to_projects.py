"""add_region_to_projects

Revision ID: 49c6ce6db5c2
Revises: 
Create Date: 2026-07-19 22:47:05.652737

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '49c6ce6db5c2'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('projects', sa.Column('region', sa.String(), nullable=False, server_default='Unknown'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('projects', 'region')
