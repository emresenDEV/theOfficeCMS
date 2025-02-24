from flask import Flask, jsonify, request
from flask_session import Session
from flask_cors import CORS
from flask_cors import cross_origin
from config import Config
from database import db
import logging
from routes.account_routes import account_bp
from routes.auth_routes import auth_bp
from routes.branch_routes import branch_bp
from routes.calendar_routes import calendar_bp
from routes.commission_routes import commission_bp
from routes.department_routes import department_bp
from routes.employee_routes import employee_bp
from routes.industry_routes import industry_bp
from routes.invoice_routes import invoice_bp
from routes.notes_routes import notes_bp
from routes.sales_routes import sales_bp 
from routes.task_routes import task_bp
from routes.user_routes import user_bp
from routes.user_role_routes import user_role_bp


app = Flask(__name__)
app.config.from_object(Config)

Session(app)  # ✅ Initialize Flask-Session
db.init_app(app) # ✅ Initialize Database

# ✅ Apply CORS
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "http://localhost:5174"}})

# CORS(app, supports_credentials=True, origins=[r"/*", "http://localhost:5173", "http://localhost:5174"])
# CORS(app, supports_credentials=True, resources={r"/*": {"origins": ["http://localhost:5173", "http://localhost:5174"]}})

@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin")
    allowed_origin = "http://localhost:5174"  # ✅ Only allowing 5174

    if origin == allowed_origin:
        response.headers["Access-Control-Allow-Origin"] = origin  # ✅ Set the allowed origin
    
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    
    return response


# @app.after_request
# def add_cors_headers(response):
#     """✅ Ensure CORS headers allow multiple origins"""
#     response.headers["Access-Control-Allow-Origin"] = request.headers.get("Origin", "http://localhost:5173")
#     response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
#     response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
#     response.headers["Access-Control-Allow-Credentials"] = "true"
    
#     return response


# ✅ Register Blueprints (Routes)
app.register_blueprint(account_bp, url_prefix="/accounts")
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(branch_bp, url_prefix="/branches")
app.register_blueprint(calendar_bp, url_prefix="/calendar")
app.register_blueprint(commission_bp, url_prefix="/commissions")
app.register_blueprint(department_bp, url_prefix="/departments")
app.register_blueprint(employee_bp, url_prefix="/employees")
app.register_blueprint(industry_bp, url_prefix="/industries")
app.register_blueprint(invoice_bp, url_prefix="/invoices")
app.register_blueprint(notes_bp, url_prefix="/notes")
app.register_blueprint(sales_bp, url_prefix="/sales")
app.register_blueprint(task_bp, url_prefix="/tasks")
app.register_blueprint(user_bp, url_prefix="/users")
app.register_blueprint(user_role_bp, url_prefix="/roles")

# Test Route
@app.route('/')
def home():
    return jsonify({'message': 'Flask Backend Running!'})

# CORS Test Route
@app.route('/test-cors', methods=['GET', 'OPTIONS'])
@cross_origin(origin="http://localhost:5174", supports_credentials=True)
def test_cors():
    return jsonify({"message": "CORS is working!"}), 200


if __name__ == "__main__":
    with app.app_context():  # ✅ Proper Context
        db.create_all()  # ✅ Creates tables if they don't exist
        app.run(debug=True, port=5001)  # ✅ Ensure correct port is set
