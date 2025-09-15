-- db/init.sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    password TEXT NOT NULL
);

CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK(status IN ('pending','completed')) NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    comment TEXT,
    rating INTEGER CHECK(rating BETWEEN 1 AND 5),
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Seed data
INSERT INTO users (email, full_name, password) VALUES
('alice@mail.com', 'Alice Johnson', 'alice123'),
('bob@mail.com', 'Bob Smith', 'bob123');

INSERT INTO tasks (user_id, title, description, status) VALUES
(1, 'Task A', 'Description for Task A', 'pending'),
(1, 'Task B', 'Description for Task B', 'completed'),
(2, 'Task C', 'Description for Task C', 'pending');

INSERT INTO feedback (user_id, comment, rating) VALUES
(1, 'Great work', 5),
(1, 'Needs improvement', 3),
(2, 'Excellent', 4);
