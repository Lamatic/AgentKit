CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    action TEXT NOT NULL
);

ALTER TABLE users
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_users_email_verified
ON users(email_verified);

DROP TABLE temp_users;