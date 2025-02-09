from flask import Flask, jsonify, request, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS, cross_origin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

# =========================================
#  APP INITIALIZATION
# =========================================
app = Flask(__name__)
app.secret_key = "secret_key" # TODO: Change this to a random value for production

# CORS(
#     app, 
#     resources={r"/*": {"origins": ["http://localhost:5173"]}}, #only allows frontend
#     supports_credentials=True
# )

CORS(app, supports_credentials=True)  # Allows requests from any frontend


# Access-Control-Allow-Origin (CORS) Headers
# @app.after_request
# def add_cors_headers(response):
#     """✅ Ensure every response includes CORS headers"""
#     response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
#     response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
#     response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
#     response.headers["Access-Control-Allow-Credentials"] = "true"
    
#     print(f"✅ CORS Headers Applied: {response.headers['Access-Control-Allow-Origin']}")
#     return response

@app.after_request
def add_cors_headers(response):
    """✅ Ensure every response includes CORS headers"""
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    
    print(f"✅ CORS Headers Applied: {response.headers['Access-Control-Allow-Origin']}")
    return response
    

# Database Configuration (Update for your PostgreSQL settings)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:Alaska2013!@localhost/dunderdata'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize Database
db = SQLAlchemy(app)


# Create Tables
with app.app_context():
    db.create_all()

# =========================================
# API TEST ROUTE
# =========================================


@app.route('/')
def home():
    return jsonify({'message': 'Flask Backend Running!'})


# =========================================
# ✅ START FLASK SERVER
# =========================================

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5001, debug=True)

