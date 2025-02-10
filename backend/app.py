from flask import Flask
from flask_cors import CORS
from database import db
from routes.account_routes import account_bp
from routes.auth_routes import auth_bp
from routes.calendar_routes import calendar_bp
from routes.commission_routes import commission_bp
from routes.invoice_routes import invoice_bp
from routes.notes_routes import notes_bp
from routes.task_routes import task_bp
from routes.user_routes import user_bp

app = Flask(__name__)
app.config.from_object("config.Config")

# ✅ Initialize Database 
db.init_app(app)  # ✅ Register `db` with `app`

# ✅ Apply CORS
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

@app.after_request
def add_cors_headers(response):
    """✅ Ensure every response includes CORS headers"""
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    
    print(f"✅ CORS Headers Applied: {response.headers['Access-Control-Allow-Origin']}")
    return response


# ✅ Register Blueprints (Routes)
app.register_blueprint(account_bp, url_prefix="/accounts")
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(calendar_bp, url_prefix="/calendar")
app.register_blueprint(commission_bp, url_prefix="/commissions")
app.register_blueprint(invoice_bp, url_prefix="/invoices")
app.register_blueprint(notes_bp, url_prefix="/notes")
app.register_blueprint(task_bp, url_prefix="/tasks")
app.register_blueprint(user_bp, url_prefix="/users")

# Test Route
@app.route('/')
def home():
    return jsonify({'message': 'Flask Backend Running!'})

if __name__ == "__main__":
    with app.app_context():  # ✅ Proper Context
        db.create_all()  # ✅ Creates tables if they don't exist
    app.run(debug=True, port=5001)  # ✅ Ensure correct port is set
