from flask import Flask, jsonify
from flask_session import Session
from flask_cors import CORS
from config import Config
from database import db
import os

# Route Blueprints
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
from routes.payment_routes import payment_bp
from routes.sales_routes import sales_bp 
from routes.task_routes import task_bp
from routes.user_routes import user_bp
from routes.user_role_routes import user_role_bp
from routes.services_route import service_bp


app = Flask(__name__)
app.config.from_object(Config)

Session(app)
db.init_app(app)

# Global CORS config for both localhost & Amplify
# CORS(app, supports_credentials=True, resources={r"/*": {"origins": [
#     "http://localhost:5174",
#     "https://theofficecms.com",
#     "https://www.theofficecms.com"
# ]}})
CORS(app,
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     origins=["http://localhost:5174", "https://theofficecms.com", "https://www.theofficecms.com", "https://api.theofficecms.com"])

# Route Blueprints
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
app.register_blueprint(payment_bp, url_prefix="/payment")
app.register_blueprint(sales_bp, url_prefix="/sales")
app.register_blueprint(service_bp, url_prefix="/services")
app.register_blueprint(task_bp, url_prefix="/tasks")
app.register_blueprint(user_bp, url_prefix="/users")
app.register_blueprint(user_role_bp, url_prefix="/roles")

# Root Route
@app.route('/')
def home():
    return jsonify({'message': 'Flask Backend Running!'})

# CORS Test Route 
@app.route('/test-cors')
def test_cors():
    return jsonify({"message": "CORS is working!"}), 200


# if __name__ == "__main__":
#     with app.app_context():
#         db.create_all()

#         use_ssl = os.getenv("USE_SSL", "false").lower() == "true"
#         if use_ssl:
#             app.run(host="0.0.0.0", port=5001, ssl_context=('cert.pem', 'key.pem'))
#         else:
#             app.run(host="0.0.0.0", port=5001, debug=True)
            
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=5001, debug=False)
