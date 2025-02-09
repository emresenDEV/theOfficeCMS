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

# ✅ Apply CORS
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

# ✅ Initialize Database
init_db(app)

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
    app.run(debug=True, port=5001)  # ✅ Ensure correct port is set
