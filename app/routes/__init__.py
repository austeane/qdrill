from flask import Blueprint

main_bp = Blueprint('main', __name__)

def register_blueprints(app):
    from app.routes.drills import drills_bp
    from app.routes.practice_plans import practice_plans_bp

    app.register_blueprint(drills_bp, url_prefix='/api/drills')
    app.register_blueprint(practice_plans_bp, url_prefix='/api/practice-plans')
