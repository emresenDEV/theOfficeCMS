from flask import Flask, jsonify, request
from flask_session import Session
from flask_cors import CORS
from config import Config
from database import db
from routes.account_routes import account_bp
from routes.auth_routes import auth_bp
from routes.calendar_routes import calendar_bp
from routes.commission_routes import commission_bp
from routes.invoice_routes import invoice_bp
from routes.notes_routes import notes_bp
from routes.task_routes import task_bp
from routes.user_routes import user_bp
from routes.sales_routes import sales_bp 
from routes.task_routes import task_bp

app = Flask(__name__)
app.config.from_object(Config)

Session(app)  # ✅ Initialize Flask-Session

# ✅ Initialize Database 
db.init_app(app)

# ✅ Apply CORS
# CORS(app, supports_credentials=True, origins=[r"*", "http://localhost:5173", "http://localhost:5174"])
CORS(app, supports_credentials=True, resources={r"/*": {"origins": ["http://localhost:5173", "http://localhost:5174"]}})

@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin")
    allowed_origins = ["http://localhost:5173", "http://localhost:5174"]

    if origin in allowed_origins:
        response.headers["Access-Control-Allow-Origin"] = origin
    
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
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
app.register_blueprint(calendar_bp, url_prefix="/calendar")
app.register_blueprint(commission_bp, url_prefix="/commissions")
app.register_blueprint(invoice_bp, url_prefix="/invoices")
app.register_blueprint(notes_bp, url_prefix="/notes")
app.register_blueprint(task_bp, url_prefix="/tasks")
app.register_blueprint(user_bp, url_prefix="/users")
app.register_blueprint(sales_bp, url_prefix="/sales")

# Test Route
@app.route('/')
def home():
    return jsonify({'message': 'Flask Backend Running!'})

if __name__ == "__main__":
    with app.app_context():  # ✅ Proper Context
        db.create_all()  # ✅ Creates tables if they don't exist
    app.run(debug=True, port=5001)  # ✅ Ensure correct port is set
