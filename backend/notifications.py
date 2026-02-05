from models import Notifications
from database import db


def create_notification(
    user_id,
    notif_type,
    title,
    message=None,
    link=None,
    account_id=None,
    invoice_id=None,
    source_type=None,
    source_id=None,
    event_time=None,
):
    notification = Notifications(
        user_id=user_id,
        type=notif_type,
        title=title,
        message=message,
        link=link,
        account_id=account_id,
        invoice_id=invoice_id,
        source_type=source_type,
        source_id=source_id,
        event_time=event_time,
        is_read=False,
    )
    db.session.add(notification)
    return notification
