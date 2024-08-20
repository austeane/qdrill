from flask import Blueprint, request, jsonify
from app import db
from app.models import Drill
from app.schemas import DrillSchema

drills_bp = Blueprint('drills', __name__)

@drills_bp.route('/', methods=['POST'])
def create_drill():
    print("Received a POST request to /api/drills")

    try:
        data = request.get_json()
        print("Request data: ", data)
        drill_schema = DrillSchema()
        
        # Validate the data
        errors = drill_schema.validate(data)
        if errors:
            return jsonify(errors), 400
        
        # Create a Drill object
        drill = drill_schema.load(data)
        print("Created drill object: ", drill)
        
        # Add to session and commit
        db.session.add(drill)
        db.session.commit()
        
        # Serialize and return the response
        response = drill_schema.dump(drill)
        print("Response data: ", response)
        return jsonify(response), 201
    except Exception as e:
        import traceback
        print("Error occurred: ", str(e), type(e), traceback.format_exc())
        db.session.rollback()  # Rollback the session in case of error
        return jsonify({"error": "An error occurred while processing the request"}), 500

@drills_bp.route('/', methods=['GET'])
def get_drills():
    drills = Drill.query.all()
    drill_schema = DrillSchema(many=True)
    return jsonify(drill_schema.dump(drills)), 200

@drills_bp.route('/<int:id>', methods=['GET'])
def get_drill(id):
    print(f"Received a GET request to /api/drills/{id}")
    try:
        drill = Drill.query.get_or_404(id)
        print(f"Drill found: {drill}")
        drill_schema = DrillSchema()
        return jsonify(drill_schema.dump(drill)), 200
    except Exception as e:
        import traceback
        print(f"Error occurred while fetching drill with ID {id}: ", str(e), type(e), traceback.format_exc())
        return jsonify({"error": f"Drill with ID {id} not found"}), 404
