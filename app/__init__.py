from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_cors import CORS

app = Flask(__name__)
app.config.from_object('config.Config')

db = SQLAlchemy(app)
ma = Marshmallow(app)
CORS(app,  resources={r"/*": {"origins": "*"}})

from app.routes.drills import drills_bp
from app.routes.practice_plans import practice_plans_bp

app.register_blueprint(drills_bp, url_prefix='/api/drills')
app.register_blueprint(practice_plans_bp, url_prefix='/api/practice-plans')
