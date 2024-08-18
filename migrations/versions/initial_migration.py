"""Initial migration script to create tables for drills and practice plans."""

from alembic import op
import sqlalchemy as sa


def upgrade():
    # Create drills table
    op.create_table(
        'drill',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('brief_description', sa.String(255), nullable=False),
        sa.Column('detailed_description', sa.Text),
        sa.Column('skill_level', sa.String(50), nullable=False),
        sa.Column('complexity', sa.String(50)),
        sa.Column('suggested_length', sa.String(50), nullable=False),
        sa.Column('number_of_people', sa.Integer),
        sa.Column('skills_focused_on', sa.String(255), nullable=False),
        sa.Column('positions_focused_on', sa.String(255), nullable=False),
        sa.Column('video_link', sa.String(255)),
        sa.Column('images', sa.PickleType)
    )

    # Create practice_plans table
    op.create_table(
        'practice_plan',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('practice_goals', sa.String(255)),
        sa.Column('phase_of_season', sa.String(50)),
        sa.Column('number_of_participants', sa.Integer),
        sa.Column('level_of_experience', sa.String(50)),
        sa.Column('skills_focused_on', sa.String(255)),
        sa.Column('overview', sa.Text),
        sa.Column('time_per_drill', sa.String(50)),
        sa.Column('breaks_between_drills', sa.String(50)),
        sa.Column('total_practice_time', sa.String(50))
    )


def downgrade():
    # Drop practice_plans table
    op.drop_table('practice_plan')

    # Drop drills table
    op.drop_table('drill')
