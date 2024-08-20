from flask import Blueprint, request, jsonify
from app import db
from app.models import Drill
from app.schemas import DrillSchema

drills_bp = Blueprint('drills', __name__)
print("Im updating code at all")

@drills_bp.route('/', methods=['POST'])
def create_drill():
    print("Received a POST request to /api/drills")

    try:
        data = request.get_json()
        print("Request data: ", data)
        drill_schema = DrillSchema()
        errors = drill_schema.validate(data)
        if errors:
            return jsonify(errors), 400
        drill = drill_schema.load(data)
        print("Created drill object: ", drill)
        db.session.add(drill)
        db.session.commit()
        response = drill_schema.jsonify(drill)
        print("Response data: ", response)
        return response, 201
    except Exception as e:
        print("Error occurred: ", str(e))
        return jsonify({"error": "An error occurred while processing the request"}), 500

@drills_bp.route('/', methods=['GET'])
def get_drills():
    drills = Drill.query.all()
    drill_schema = DrillSchema(many=True)
    return drill_schema.jsonify(drills), 200

@drills_bp.route('/<int:id>', methods=['GET'])
def get_drill(id):
    drill = Drill.query.get_or_404(id)
    drill_schema = DrillSchema()
    return drill_schema.jsonify(drill), 200
