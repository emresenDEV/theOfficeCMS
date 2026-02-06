import argparse
import calendar
import random
import string
from datetime import date, datetime, timedelta

import pytz

from app import app
from database import db
from models import (
    Account,
    AccountContacts,
    Branches,
    Contact,
    ContactInteractions,
    Industry,
    Invoice,
    InvoicePipeline,
    InvoiceServices,
    Notes,
    Payment,
    PaymentMethods,
    Region,
    Service,
    Tasks,
    Users,
    Commissions,
)


central = pytz.timezone("America/Chicago")


OFFICE_NAMES = [
    "Dunder Mifflin",
    "Schrute Farms",
    "Michael Scott Paper Company",
    "WUPHF.com",
    "Vance Refrigeration",
    "Prince Family Paper",
    "Scranton Business Park",
    "Athlead",
    "Serenity by Jan",
    "Saticoy Steel",
    "Utica Paper",
    "Staples Scranton",
]

CONTACT_FIRST_NAMES = [
    "Jim",
    "Pam",
    "Dwight",
    "Angela",
    "Kelly",
    "Stanley",
    "Phyllis",
    "Andy",
    "Oscar",
    "Kevin",
    "Erin",
    "Creed",
    "Toby",
    "Darryl",
    "Holly",
    "Jan",
    "Ryan",
    "Meredith",
]

CONTACT_LAST_NAMES = [
    "Halpert",
    "Beesly",
    "Schrute",
    "Martin",
    "Kapoor",
    "Hudson",
    "Vance",
    "Bernard",
    "Martinez",
    "Malone",
    "Hannon",
    "Bratton",
    "Flenderson",
    "Philbin",
    "Flax",
    "Levinson",
    "Howard",
    "Palmer",
]

CONTACT_TITLES = [
    "Office Manager",
    "Purchasing Lead",
    "Operations Director",
    "Facilities Manager",
    "HR Coordinator",
    "Executive Assistant",
    "Procurement Specialist",
]

INTERACTION_TYPES = ["call", "email", "meeting"]

NOTE_SNIPPETS = [
    "Discussed quarterly supply needs.",
    "Customer prefers recycled paper options.",
    "Confirmed delivery schedule and contact preference.",
    "Requested updated price sheet and volume discounts.",
    "Follow-up planned for next week.",
]

TASK_SNIPPETS = [
    "Confirm paper order quantities.",
    "Schedule follow-up call.",
    "Send updated price sheet.",
    "Verify delivery address.",
    "Review contract renewal terms.",
    "Update CRM notes.",
]


def _random_phone():
    return f"{random.randint(200, 989)}-{random.randint(100, 999)}-{random.randint(1000, 9999)}"


def _random_email(first, last, domain="dundermifflin.com"):
    handle = f"{first}.{last}".lower().replace(" ", "")
    suffix = "".join(random.choices(string.digits, k=3))
    return f"{handle}{suffix}@{domain}"


def _random_datetime(start_dt, end_dt):
    delta = end_dt - start_dt
    seconds = random.randint(0, int(delta.total_seconds()))
    return start_dt + timedelta(seconds=seconds)


def _month_bounds(year, month):
    last_day = calendar.monthrange(year, month)[1]
    start = date(year, month, 1)
    end = date(year, month, last_day)
    return start, end


def _quarter_bounds(year, month):
    quarter_start_month = ((month - 1) // 3) * 3 + 1
    quarter_end_month = quarter_start_month + 2
    start = date(year, quarter_start_month, 1)
    end_day = calendar.monthrange(year, quarter_end_month)[1]
    end = date(year, quarter_end_month, end_day)
    return start, end


def _pick_sales_rep(users):
    reps = [u for u in users if getattr(u, "role_id", None) == 3] or users
    return random.choice(reps)


def _unique_account_name(existing_names):
    for _ in range(50):
        base = random.choice(OFFICE_NAMES)
        suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=3))
        name = f"{base} {suffix}"
        if name.lower() not in existing_names:
            existing_names.add(name.lower())
            return name
    raise RuntimeError("Could not generate unique account name.")


def _unique_contact(existing_emails):
    for _ in range(50):
        first = random.choice(CONTACT_FIRST_NAMES)
        last = random.choice(CONTACT_LAST_NAMES)
        email = _random_email(first, last)
        if email.lower() not in existing_emails:
            existing_emails.add(email.lower())
            return first, last, email
    raise RuntimeError("Could not generate unique contact.")


def _build_invoice_services(services):
    service_total = 0
    service_discount_total = 0
    invoice_services = []

    for service in random.sample(services, k=random.randint(2, 3)):
        quantity = random.randint(1, 5)
        price_per_unit = float(service.price_per_unit or random.uniform(20, 120))
        discount_percent = random.choice([0, 0.05, 0.1])
        discount_total = price_per_unit * quantity * discount_percent
        total_price = price_per_unit * quantity - discount_total
        service_total += price_per_unit * quantity
        service_discount_total += discount_total
        invoice_services.append({
            "service_id": service.service_id,
            "quantity": quantity,
            "price_per_unit": price_per_unit,
            "discount_percent": discount_percent,
            "discount_total": round(discount_total, 2),
            "total_price": round(total_price, 2),
        })

    return invoice_services, service_total, service_discount_total


def _create_invoice_pipeline(invoice, created_at, paid=False, paid_at=None):
    pipeline = InvoicePipeline(
        invoice_id=invoice.invoice_id,
        current_stage="payment_received" if paid else "payment_not_received",
        start_date=created_at.date(),
        contacted_at=created_at,
        order_placed_at=created_at,
        payment_not_received_at=(created_at + timedelta(days=2)) if not paid else None,
        payment_received_at=paid_at if paid else None,
        updated_at=paid_at if paid else created_at,
    )
    db.session.add(pipeline)


def _create_payment(invoice, rep, amount, paid_at, method_id):
    if not method_id:
        return
    payment = Payment(
        invoice_id=invoice.invoice_id,
        account_id=invoice.account_id,
        sales_rep_id=rep.user_id,
        logged_by=rep.username,
        payment_method=method_id,
        last_four_payment_method=str(random.randint(1000, 9999)),
        total_paid=amount,
        date_paid=paid_at,
    )
    db.session.add(payment)
    db.session.flush()

    if rep.receives_commission:
        rate = float(rep.commission_rate or 0)
        commission_amount = amount * rate
        db.session.add(Commissions(
            sales_rep_id=rep.user_id,
            invoice_id=invoice.invoice_id,
            commission_rate=rate,
            commission_amount=commission_amount,
            date_paid=paid_at,
            payment_id=payment.payment_id,
        ))


def main():
    parser = argparse.ArgumentParser(description="Generate mock data for theOfficeCMS.")
    parser.add_argument("--month", type=int, help="Month (1-12) for manual run")
    parser.add_argument("--year", type=int, help="Year (YYYY) for manual run")
    parser.add_argument("--auto", action="store_true", help="Auto mode (no prompts). Uses current quarter.")
    parser.add_argument("--seed", type=int, help="Random seed for repeatable data")
    args = parser.parse_args()

    if args.seed is not None:
        random.seed(args.seed)

    today = datetime.now(central).date()
    if args.auto:
        start_date, end_date = _quarter_bounds(today.year, today.month)
    else:
        month = args.month
        year = args.year
        if not month or not year:
            month = int(input("Enter month (1-12): ").strip())
            year = int(input("Enter year (YYYY): ").strip())
        start_date, end_date = _month_bounds(year, month)

    start_dt = datetime.combine(start_date, datetime.min.time())
    end_dt = datetime.combine(end_date, datetime.max.time())

    with app.app_context():
        users = Users.query.all()
        if not users:
            raise RuntimeError("No users found. Seed users before generating mock data.")

        services = Service.query.all()
        if not services:
            raise RuntimeError("No services found. Add services before generating mock data.")

        payment_method = PaymentMethods.query.order_by(PaymentMethods.method_id).first()
        if not payment_method:
            raise RuntimeError("No payment methods found. Add payment methods before generating mock data.")
        payment_method_id = payment_method.method_id

        regions = Region.query.all()
        branches = Branches.query.all()
        industries = Industry.query.all()

        existing_accounts = {name.lower() for name, in db.session.query(Account.business_name).all()}
        existing_emails = {email.lower() for email, in db.session.query(Contact.email).filter(Contact.email.isnot(None)).all()}

        new_accounts = []
        for _ in range(3):
            rep = _pick_sales_rep(users)
            branch = random.choice(branches) if branches else None
            region = None
            if regions and branch:
                region = next((r for r in regions if r.region_name == branch.branch_name), None)
            industry = random.choice(industries) if industries else None

            business_name = _unique_account_name(existing_accounts)
            account = Account(
                business_name=business_name,
                phone_number=_random_phone(),
                email=f"billing@{business_name.replace(' ', '').lower()}.com"[:100],
                address=f"{random.randint(100, 999)} Paper St.",
                city="Scranton",
                state="PA",
                zip_code=branch.zip_code if branch else "18503",
                industry_id=industry.industry_id if industry else None,
                sales_rep_id=rep.user_id,
                branch_id=branch.branch_id if branch else None,
                region_id=region.region_id if region else None,
                region=region.region_name if region else (branch.branch_name if branch else None),
                updated_by_user_id=rep.user_id,
                date_created=_random_datetime(start_dt, end_dt),
                date_updated=_random_datetime(start_dt, end_dt),
            )
            db.session.add(account)
            db.session.flush()
            new_accounts.append(account)

            first, last, email = _unique_contact(existing_emails)
            contact = Contact(
                first_name=first,
                last_name=last,
                title=random.choice(CONTACT_TITLES),
                phone=_random_phone(),
                email=email,
                status="active",
                contact_owner_user_id=rep.user_id,
                created_at=_random_datetime(start_dt, end_dt),
            )
            db.session.add(contact)
            db.session.flush()

            db.session.add(AccountContacts(
                account_id=account.account_id,
                contact_id=contact.contact_id,
                is_primary=True,
            ))

            # interactions
            for _ in range(3):
                db.session.add(ContactInteractions(
                    contact_id=contact.contact_id,
                    account_id=account.account_id,
                    user_id=rep.user_id,
                    interaction_type=random.choice(INTERACTION_TYPES),
                    subject=random.choice(NOTE_SNIPPETS),
                    notes=random.choice(NOTE_SNIPPETS),
                    phone_number=contact.phone,
                    email_address=contact.email,
                    created_at=_random_datetime(start_dt, end_dt),
                ))

            # followup task
            db.session.add(Tasks(
                user_id=rep.user_id,
                account_id=account.account_id,
                contact_id=contact.contact_id,
                assigned_to=rep.user_id,
                task_description=f"Follow up with {first} {last}",
                due_date=_random_datetime(start_dt, end_dt) + timedelta(days=3),
                is_completed=False,
                is_followup=True,
                date_created=_random_datetime(start_dt, end_dt),
            ))

            # account notes
            for _ in range(2):
                db.session.add(Notes(
                    account_id=account.account_id,
                    user_id=rep.user_id,
                    note_text=random.choice(NOTE_SNIPPETS),
                    date_created=_random_datetime(start_dt, end_dt),
                ))

            # account tasks
            for _ in range(2):
                db.session.add(Tasks(
                    user_id=rep.user_id,
                    account_id=account.account_id,
                    assigned_to=rep.user_id,
                    task_description=random.choice(TASK_SNIPPETS),
                    due_date=_random_datetime(start_dt, end_dt) + timedelta(days=random.randint(1, 7)),
                    is_completed=False,
                    is_followup=False,
                    date_created=_random_datetime(start_dt, end_dt),
                ))

            # update account's primary contact fields
            account.contact_first_name = contact.first_name
            account.contact_last_name = contact.last_name

        # Create invoices
        all_accounts = Account.query.all()
        invoice_dates = [_random_datetime(start_dt, end_dt) for _ in range(52)]
        paid_indices = set(random.sample(range(52), 26))

        for idx in range(52):
            account = random.choice(all_accounts)
            rep = Users.query.get(account.sales_rep_id) if account.sales_rep_id else _pick_sales_rep(users)
            created_at = invoice_dates[idx]
            due_date = created_at.date() + timedelta(days=random.randint(14, 30))

            invoice_services, service_total, service_discount_total = _build_invoice_services(services)
            invoice_discount_percent = random.choice([0, 0.02, 0.05])
            invoice_discount_amount = (service_total - service_discount_total) * invoice_discount_percent
            subtotal_after_discount = service_total - service_discount_total - invoice_discount_amount
            tax_rate = random.choice([0.06, 0.07, 0.08])
            tax_amount = subtotal_after_discount * tax_rate
            final_total = subtotal_after_discount + tax_amount

            invoice = Invoice(
                account_id=account.account_id,
                sales_rep_id=rep.user_id,
                tax_rate=tax_rate,
                tax_amount=round(tax_amount, 2),
                discount_percent=invoice_discount_percent,
                discount_amount=round(invoice_discount_amount, 2),
                final_total=round(final_total, 2),
                status="Paid" if idx in paid_indices else "Pending",
                date_created=created_at,
                date_updated=created_at,
                due_date=due_date,
            )
            db.session.add(invoice)
            db.session.flush()

            for service_row in invoice_services:
                db.session.add(InvoiceServices(
                    invoice_id=invoice.invoice_id,
                    service_id=service_row["service_id"],
                    quantity=service_row["quantity"],
                    price_per_unit=service_row["price_per_unit"],
                    total_price=service_row["total_price"],
                    discount_percent=service_row["discount_percent"],
                    discount_total=service_row["discount_total"],
                ))

            if idx in paid_indices:
                paid_at = created_at + timedelta(days=random.randint(0, 5))
                _create_payment(invoice, rep, round(final_total, 2), paid_at, payment_method_id)
                invoice.status = "Paid"
                _create_invoice_pipeline(invoice, created_at, paid=True, paid_at=paid_at)
            else:
                invoice.status = "Past Due" if due_date < today else "Pending"
                _create_invoice_pipeline(invoice, created_at, paid=False)

        # Random tasks (additional 25)
        for _ in range(25):
            account = random.choice(all_accounts)
            rep = Users.query.get(account.sales_rep_id) if account.sales_rep_id else _pick_sales_rep(users)
            task = Tasks(
                user_id=rep.user_id,
                account_id=account.account_id,
                assigned_to=rep.user_id,
                task_description=random.choice(TASK_SNIPPETS),
                due_date=_random_datetime(start_dt, end_dt) + timedelta(days=random.randint(1, 10)),
                is_completed=False,
                is_followup=False,
                date_created=_random_datetime(start_dt, end_dt),
            )
            db.session.add(task)

        db.session.commit()

        print("✅ Mock data generated successfully.")
        print("Accounts created: 3 (1 contact each)")
        print("Invoices created: 52 (26 paid)")
        print("Tasks created: 25 + account/contact followups")


if __name__ == "__main__":
    main()
