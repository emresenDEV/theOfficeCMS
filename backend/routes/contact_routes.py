from flask import Blueprint, jsonify, request
from sqlalchemy import or_, func
from models import Contact, Account, AccountContacts, ContactFollowers, ContactInteractions, Tasks, Users
from database import db
from audit import create_audit_log
from notifications import create_notification

contact_bp = Blueprint("contacts", __name__)

def _split_contact_name(name):
    if not name:
        return None, None
    parts = [p for p in name.strip().split(" ") if p]
    if not parts:
        return None, None
    if len(parts) == 1:
        return parts[0], None
    return parts[0], " ".join(parts[1:])


def _serialize_contact(contact, include_accounts=False):
    owner = Users.query.get(contact.contact_owner_user_id) if contact.contact_owner_user_id else None
    payload = {
        "contact_id": contact.contact_id,
        "first_name": contact.first_name,
        "last_name": contact.last_name,
        "title": contact.title,
        "phone": contact.phone,
        "email": contact.email,
        "status": contact.status,
        "do_not_call": contact.do_not_call,
        "do_not_call_date": contact.do_not_call_date.isoformat() if contact.do_not_call_date else None,
        "email_opt_out": contact.email_opt_out,
        "email_opt_out_date": contact.email_opt_out_date.isoformat() if contact.email_opt_out_date else None,
        "contact_owner_user_id": contact.contact_owner_user_id,
        "contact_owner_name": f"{owner.first_name} {owner.last_name}".strip() if owner else None,
        "created_at": contact.created_at.isoformat() if contact.created_at else None,
        "updated_at": contact.updated_at.isoformat() if contact.updated_at else None,
    }

    if include_accounts:
        payload["accounts"] = [
            {
                "account_id": account.account_id,
                "business_name": account.business_name,
                "phone_number": account.phone_number,
                "email": account.email,
                "address": account.address,
                "city": account.city,
                "state": account.state,
                "zip_code": account.zip_code,
                "sales_rep_id": account.sales_rep_id,
            }
            for account in contact.accounts
        ]

    return payload


def _notify_contact_followers(contact_id, actor_user_id, title, message, link):
    follower_rows = ContactFollowers.query.filter_by(contact_id=contact_id).all()
    for row in follower_rows:
        if actor_user_id and row.user_id == actor_user_id:
            continue
        create_notification(
            user_id=row.user_id,
            notif_type="contact_activity",
            title=title,
            message=message,
            link=link,
            source_type="contact",
            source_id=contact_id,
        )


def _backfill_contacts_from_accounts(actor_user_id=None, actor_email=None):
    existing_links = {
        row.account_id
        for row in AccountContacts.query.with_entities(AccountContacts.account_id).all()
    }

    account_query = Account.query.filter(
        or_(
            Account.contact_first_name.isnot(None),
            Account.contact_last_name.isnot(None),
            Account.contact_name.isnot(None),
            Account.email.isnot(None),
            Account.phone_number.isnot(None),
        )
    )
    if existing_links:
        account_query = account_query.filter(~Account.account_id.in_(existing_links))

    accounts = account_query.all()
    created = 0

    for account in accounts:
        first_name = account.contact_first_name
        last_name = account.contact_last_name
        if not first_name and not last_name and account.contact_name:
            first_name, last_name = _split_contact_name(account.contact_name)

        contact = Contact(
            first_name=first_name,
            last_name=last_name,
            phone=account.phone_number,
            email=account.email,
            status="active",
            contact_owner_user_id=account.sales_rep_id or account.updated_by_user_id or actor_user_id,
        )
        db.session.add(contact)
        db.session.flush()
        db.session.add(AccountContacts(account_id=account.account_id, contact_id=contact.contact_id, is_primary=True))

        create_audit_log(
            entity_type="contact",
            entity_id=contact.contact_id,
            action="create",
            user_id=actor_user_id,
            user_email=actor_email,
            after_data={
                "contact_id": contact.contact_id,
                "first_name": contact.first_name,
                "last_name": contact.last_name,
                "email": contact.email,
                "phone": contact.phone,
                "status": contact.status,
                "contact_owner_user_id": contact.contact_owner_user_id,
                "account_ids": [account.account_id],
            },
            contact_id=contact.contact_id,
        )

        created += 1

    if created:
        db.session.commit()
    return created


@contact_bp.route("", methods=["GET"])
@contact_bp.route("/", methods=["GET"])
def get_contacts():
    search = request.args.get("search", "").strip().lower()
    status = request.args.get("status")
    account_id = request.args.get("account_id", type=int)
    owner_id = request.args.get("owner_id", type=int)

    if not search and not status and not account_id and not owner_id:
        if Contact.query.count() == 0:
            _backfill_contacts_from_accounts()

    query = Contact.query

    if status:
        query = query.filter(Contact.status == status)

    if owner_id:
        query = query.filter(Contact.contact_owner_user_id == owner_id)

    if account_id:
        query = query.join(AccountContacts).filter(AccountContacts.account_id == account_id)

    if search:
        like = f"%{search}%"
        query = (
            query.outerjoin(AccountContacts)
            .outerjoin(Account, Account.account_id == AccountContacts.account_id)
            .outerjoin(Users, Users.user_id == Contact.contact_owner_user_id)
            .filter(
                or_(
                    func.lower(Contact.first_name).like(like),
                    func.lower(Contact.last_name).like(like),
                    func.lower(Contact.title).like(like),
                    func.lower(Contact.email).like(like),
                    func.lower(Contact.phone).like(like),
                    func.lower(Account.business_name).like(like),
                    func.lower(Account.address).like(like),
                    func.lower(Account.city).like(like),
                    func.lower(Account.state).like(like),
                    func.lower(Account.email).like(like),
                    func.lower(Account.phone_number).like(like),
                    func.lower(Users.first_name).like(like),
                    func.lower(Users.last_name).like(like),
                )
            )
            .distinct()
        )

    contacts = query.order_by(Contact.last_name.asc().nullslast(), Contact.first_name.asc().nullslast()).all()
    return jsonify([_serialize_contact(contact, include_accounts=True) for contact in contacts]), 200


@contact_bp.route("/backfill", methods=["POST"])
def backfill_contacts():
    data = request.json or {}
    created = _backfill_contacts_from_accounts(
        actor_user_id=data.get("actor_user_id"),
        actor_email=data.get("actor_email"),
    )
    return jsonify({"created": created}), 200


@contact_bp.route("/<int:contact_id>", methods=["GET"])
def get_contact(contact_id):
    contact = Contact.query.get_or_404(contact_id)
    user_id = request.args.get("user_id", type=int)
    is_following = False
    if user_id:
        is_following = ContactFollowers.query.filter_by(contact_id=contact_id, user_id=user_id).first() is not None

    interactions = ContactInteractions.query.filter_by(contact_id=contact_id).order_by(ContactInteractions.created_at.desc()).all()
    tasks = Tasks.query.filter_by(contact_id=contact_id).order_by(Tasks.date_created.desc()).all()

    return jsonify({
        **_serialize_contact(contact, include_accounts=True),
        "is_following": is_following,
        "interactions": [
            {
                "interaction_id": interaction.interaction_id,
                "interaction_type": interaction.interaction_type,
                "subject": interaction.subject,
                "notes": interaction.notes,
                "phone_number": interaction.phone_number,
                "email_address": interaction.email_address,
                "account_id": interaction.account_id,
                "user_id": interaction.user_id,
                "created_at": interaction.created_at.isoformat() if interaction.created_at else None,
            }
            for interaction in interactions
        ],
        "tasks": [
            {
                "task_id": task.task_id,
                "task_description": task.task_description,
                "assigned_to": task.assigned_to,
                "user_id": task.user_id,
                "due_date": task.due_date.isoformat() if task.due_date else None,
                "is_completed": task.is_completed,
                "is_followup": task.is_followup,
                "account_id": task.account_id,
                "invoice_id": task.invoice_id,
            }
            for task in tasks
        ],
    }), 200


@contact_bp.route("", methods=["POST"])
@contact_bp.route("/", methods=["POST"])
def create_contact():
    data = request.json or {}
    account_ids = data.get("account_ids") or []
    if not account_ids and data.get("account_id"):
        account_ids = [data.get("account_id")]
    actor_user_id = data.get("actor_user_id")
    actor_email = data.get("actor_email")

    account_ids = [int(account_id) for account_id in account_ids if account_id]

    owner_id = data.get("contact_owner_user_id")
    if not owner_id and account_ids:
        account = Account.query.get(account_ids[0])
        owner_id = account.sales_rep_id if account else actor_user_id
    if not owner_id:
        owner_id = actor_user_id

    contact = Contact(
        first_name=data.get("first_name"),
        last_name=data.get("last_name"),
        title=data.get("title"),
        phone=data.get("phone"),
        email=data.get("email"),
        status=data.get("status", "active"),
        do_not_call=data.get("do_not_call", False),
        do_not_call_date=data.get("do_not_call_date"),
        email_opt_out=data.get("email_opt_out", False),
        email_opt_out_date=data.get("email_opt_out_date"),
        contact_owner_user_id=owner_id,
    )

    db.session.add(contact)
    db.session.flush()

    for account_id in account_ids:
        if not AccountContacts.query.filter_by(account_id=account_id, contact_id=contact.contact_id).first():
            db.session.add(AccountContacts(account_id=account_id, contact_id=contact.contact_id))

    create_audit_log(
        entity_type="contact",
        entity_id=contact.contact_id,
        action="create",
        user_id=actor_user_id,
        user_email=actor_email,
        after_data={
            "contact_id": contact.contact_id,
            "first_name": contact.first_name,
            "last_name": contact.last_name,
            "email": contact.email,
            "phone": contact.phone,
            "status": contact.status,
            "contact_owner_user_id": contact.contact_owner_user_id,
            "account_ids": account_ids,
        },
        contact_id=contact.contact_id,
    )

    db.session.commit()

    return jsonify(_serialize_contact(contact, include_accounts=True)), 201


@contact_bp.route("/<int:contact_id>", methods=["PUT"])
def update_contact(contact_id):
    contact = Contact.query.get_or_404(contact_id)
    data = request.json or {}
    actor_user_id = data.get("actor_user_id")
    actor_email = data.get("actor_email")

    before_data = {
        "first_name": contact.first_name,
        "last_name": contact.last_name,
        "title": contact.title,
        "phone": contact.phone,
        "email": contact.email,
        "status": contact.status,
        "do_not_call": contact.do_not_call,
        "do_not_call_date": contact.do_not_call_date.isoformat() if contact.do_not_call_date else None,
        "email_opt_out": contact.email_opt_out,
        "email_opt_out_date": contact.email_opt_out_date.isoformat() if contact.email_opt_out_date else None,
        "contact_owner_user_id": contact.contact_owner_user_id,
    }

    contact.first_name = data.get("first_name", contact.first_name)
    contact.last_name = data.get("last_name", contact.last_name)
    contact.title = data.get("title", contact.title)
    contact.phone = data.get("phone", contact.phone)
    contact.email = data.get("email", contact.email)
    contact.status = data.get("status", contact.status)

    if "do_not_call" in data:
        contact.do_not_call = data.get("do_not_call")
        contact.do_not_call_date = db.func.current_timestamp() if contact.do_not_call else None
    if "email_opt_out" in data:
        contact.email_opt_out = data.get("email_opt_out")
        contact.email_opt_out_date = db.func.current_timestamp() if contact.email_opt_out else None

    contact.contact_owner_user_id = data.get("contact_owner_user_id", contact.contact_owner_user_id)

    create_audit_log(
        entity_type="contact",
        entity_id=contact.contact_id,
        action="update",
        user_id=actor_user_id,
        user_email=actor_email,
        before_data=before_data,
        after_data=_serialize_contact(contact),
        contact_id=contact.contact_id,
    )

    db.session.commit()

    _notify_contact_followers(
        contact.contact_id,
        actor_user_id,
        "Contact updated",
        f"{contact.first_name or ''} {contact.last_name or ''}".strip() or "Contact",
        f"/contacts/{contact.contact_id}",
    )

    return jsonify(_serialize_contact(contact, include_accounts=True)), 200


@contact_bp.route("/<int:contact_id>/accounts", methods=["PUT"])
def update_contact_accounts(contact_id):
    contact = Contact.query.get_or_404(contact_id)
    data = request.json or {}
    add_ids = data.get("add_account_ids") or []
    remove_ids = data.get("remove_account_ids") or []
    actor_user_id = data.get("actor_user_id")
    actor_email = data.get("actor_email")

    for account_id in add_ids:
        if not AccountContacts.query.filter_by(account_id=account_id, contact_id=contact_id).first():
            db.session.add(AccountContacts(account_id=account_id, contact_id=contact_id))

    if remove_ids:
        AccountContacts.query.filter(
            AccountContacts.contact_id == contact_id,
            AccountContacts.account_id.in_(remove_ids),
        ).delete(synchronize_session=False)

    create_audit_log(
        entity_type="contact",
        entity_id=contact.contact_id,
        action="update_accounts",
        user_id=actor_user_id,
        user_email=actor_email,
        after_data={
            "add_account_ids": add_ids,
            "remove_account_ids": remove_ids,
        },
        contact_id=contact.contact_id,
    )

    db.session.commit()

    _notify_contact_followers(
        contact.contact_id,
        actor_user_id,
        "Contact accounts updated",
        f"Updated accounts for {contact.first_name or ''} {contact.last_name or ''}".strip(),
        f"/contacts/{contact.contact_id}",
    )

    return jsonify(_serialize_contact(contact, include_accounts=True)), 200


@contact_bp.route("/<int:contact_id>/primary", methods=["POST"])
def set_primary_contact(contact_id):
    data = request.json or {}
    account_id = data.get("account_id")
    if not account_id:
        return jsonify({"error": "account_id is required"}), 400
    account_id = int(account_id)

    contact = Contact.query.get_or_404(contact_id)
    account = Account.query.get_or_404(account_id)
    actor_user_id = data.get("actor_user_id")
    actor_email = data.get("actor_email")

    AccountContacts.query.filter_by(account_id=account.account_id).update(
        {"is_primary": False},
        synchronize_session=False,
    )
    link = AccountContacts.query.filter_by(account_id=account.account_id, contact_id=contact.contact_id).first()
    if not link:
        link = AccountContacts(account_id=account.account_id, contact_id=contact.contact_id, is_primary=True)
        db.session.add(link)
    else:
        link.is_primary = True

    create_audit_log(
        entity_type="account_contact",
        entity_id=account.account_id,
        action="set_primary_contact",
        user_id=actor_user_id,
        user_email=actor_email,
        after_data={
            "account_id": account.account_id,
            "contact_id": contact.contact_id,
        },
        account_id=account.account_id,
        contact_id=contact.contact_id,
    )

    db.session.commit()

    return jsonify({"primary_contact_id": contact.contact_id}), 200


@contact_bp.route("/<int:contact_id>/follow", methods=["POST"])
def follow_contact(contact_id):
    data = request.json or {}
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    existing = ContactFollowers.query.filter_by(contact_id=contact_id, user_id=user_id).first()
    if not existing:
        db.session.add(ContactFollowers(contact_id=contact_id, user_id=user_id))
        db.session.commit()

    contact = Contact.query.get(contact_id)
    if contact:
        create_notification(
            user_id=user_id,
            notif_type="contact_follow",
            title="Contact followed",
            message=f"You followed {contact.first_name or ''} {contact.last_name or ''}".strip(),
            link=f"/contacts/{contact_id}",
            source_type="contact",
            source_id=contact_id,
        )

    return jsonify({"message": "followed"}), 200


@contact_bp.route("/<int:contact_id>/unfollow", methods=["POST"])
def unfollow_contact(contact_id):
    data = request.json or {}
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    ContactFollowers.query.filter_by(contact_id=contact_id, user_id=user_id).delete()
    db.session.commit()

    contact = Contact.query.get(contact_id)
    if contact:
        create_notification(
            user_id=user_id,
            notif_type="contact_unfollow",
            title="Contact unfollowed",
            message=f"You unfollowed {contact.first_name or ''} {contact.last_name or ''}".strip(),
            link=f"/contacts/{contact_id}",
            source_type="contact",
            source_id=contact_id,
        )

    return jsonify({"message": "unfollowed"}), 200


@contact_bp.route("/<int:contact_id>/interactions", methods=["POST"])
def create_contact_interaction(contact_id):
    data = request.json or {}
    actor_user_id = data.get("actor_user_id")
    actor_email = data.get("actor_email")

    interaction = ContactInteractions(
        contact_id=contact_id,
        account_id=data.get("account_id"),
        user_id=actor_user_id,
        interaction_type=data.get("interaction_type"),
        subject=data.get("subject"),
        notes=data.get("notes"),
        phone_number=data.get("phone_number"),
        email_address=data.get("email_address"),
    )
    db.session.add(interaction)
    db.session.flush()

    create_audit_log(
        entity_type="contact_interaction",
        entity_id=interaction.interaction_id,
        action="create",
        user_id=actor_user_id,
        user_email=actor_email,
        after_data={
            "interaction_id": interaction.interaction_id,
            "interaction_type": interaction.interaction_type,
            "subject": interaction.subject,
            "account_id": interaction.account_id,
        },
        contact_id=contact_id,
        account_id=interaction.account_id,
    )

    db.session.commit()

    _notify_contact_followers(
        contact_id,
        actor_user_id,
        "Contact interaction logged",
        interaction.subject or interaction.interaction_type,
        f"/contacts/{contact_id}",
    )

    return jsonify({
        "interaction_id": interaction.interaction_id,
        "interaction_type": interaction.interaction_type,
        "subject": interaction.subject,
        "notes": interaction.notes,
        "phone_number": interaction.phone_number,
        "email_address": interaction.email_address,
        "account_id": interaction.account_id,
        "user_id": interaction.user_id,
        "created_at": interaction.created_at.isoformat() if interaction.created_at else None,
    }), 201
