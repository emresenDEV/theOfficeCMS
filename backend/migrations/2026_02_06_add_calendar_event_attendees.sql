CREATE TABLE IF NOT EXISTS calendar_event_attendees (
    event_id INTEGER NOT NULL REFERENCES calendar_events(event_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP,
    PRIMARY KEY (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_calendar_event_attendees_user
    ON calendar_event_attendees(user_id);

CREATE INDEX IF NOT EXISTS idx_calendar_event_attendees_status
    ON calendar_event_attendees(status);
