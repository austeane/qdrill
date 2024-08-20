from marshmallow import Schema, fields, validate, post_load
from app.models import Drill, PracticePlan

class DrillSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(max=100))
    brief_description = fields.Str(required=True, validate=validate.Length(max=255))
    detailed_description = fields.Str()
    skill_level = fields.Str(required=True, validate=validate.Length(max=50))
    complexity = fields.Str(validate=validate.Length(max=50))
    suggested_length = fields.Str(required=True, validate=validate.Length(max=50))
    number_of_people = fields.Int()
    skills_focused_on = fields.Str(required=True, validate=validate.Length(max=255))
    positions_focused_on = fields.Str(required=True, validate=validate.Length(max=255))
    video_link = fields.Str(validate=validate.Length(max=255))
    images = fields.List(fields.Str())

    @post_load
    def make_drill(self, data, **kwargs):
        return Drill(**data)

class PracticePlanSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(max=100))
    practice_goals = fields.Str(validate=validate.Length(max=255))
    phase_of_season = fields.Str(validate=validate.Length(max=50))
    number_of_participants = fields.Int()
    level_of_experience = fields.Str(validate=validate.Length(max=50))
    skills_focused_on = fields.Str(validate=validate.Length(max=255))
    overview = fields.Str()
    time_per_drill = fields.Str(validate=validate.Length(max=50))
    breaks_between_drills = fields.Str(validate=validate.Length(max=50))
    total_practice_time = fields.Str(validate=validate.Length(max=50))

    @post_load
    def make_practice_plan(self, data, **kwargs):
        return PracticePlan(**data)