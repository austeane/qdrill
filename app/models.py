from app import db

class Drill(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    brief_description = db.Column(db.String(255), nullable=False)
    detailed_description = db.Column(db.Text)
    skill_level = db.Column(db.String(50), nullable=False)
    complexity = db.Column(db.String(50))
    suggested_length = db.Column(db.String(50), nullable=False)
    number_of_people = db.Column(db.Integer)
    skills_focused_on = db.Column(db.PickleType, nullable=False)  # P87d9
    positions_focused_on = db.Column(db.PickleType, nullable=False)  # P55a0
    video_link = db.Column(db.String(255))
    images = db.Column(db.PickleType)

class PracticePlan(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    practice_goals = db.Column(db.String(255))
    phase_of_season = db.Column(db.String(50))
    number_of_participants = db.Column(db.Integer)
    level_of_experience = db.Column(db.String(50))
    skills_focused_on = db.Column(db.String(255))
    overview = db.Column(db.Text)
    time_per_drill = db.Column(db.String(50))
    breaks_between_drills = db.Column(db.String(50))
    total_practice_time = db.Column(db.String(50))
