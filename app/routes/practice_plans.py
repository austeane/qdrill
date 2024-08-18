from flask import Blueprint, request, jsonify
from app import db
from app.models import PracticePlan
from app.schemas import PracticePlanSchema

practice_plans_bp = Blueprint('practice_plans', __name__)

@practice_plans_bp.route('/', methods=['POST'])
def create_practice_plan():
    data = request.get_json()
    practice_plan_schema = PracticePlanSchema()
    errors = practice_plan_schema.validate(data)
    if errors:
        return jsonify(errors), 400
    practice_plan = practice_plan_schema.load(data)
    db.session.add(practice_plan)
    db.session.commit()
    return practice_plan_schema.jsonify(practice_plan), 201

@practice_plans_bp.route('/', methods=['GET'])
def get_practice_plans():
    practice_plans = PracticePlan.query.all()
    practice_plan_schema = PracticePlanSchema(many=True)
    return practice_plan_schema.jsonify(practice_plans), 200

@practice_plans_bp.route('/<int:id>', methods=['GET'])
def get_practice_plan(id):
    practice_plan = PracticePlan.query.get_or_404(id)
    practice_plan_schema = PracticePlanSchema()
    return practice_plan_schema.jsonify(practice_plan), 200
