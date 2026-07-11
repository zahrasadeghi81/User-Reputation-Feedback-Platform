# User Reputation Feedback Platform — Backend

REST API built with Django & Django REST Framework.

## Tech Stack

- Python 3.12+
- Django 5.x
- Django REST Framework
- JWT Authentication (SimpleJWT)
- SQLite (dev) / PostgreSQL (production)
- Pillow (profile photos)

## Requirements

```
pip install -r requirements.txt
```

## Run Project

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

The dev server starts at `http://127.0.0.1:8000`.

## Project Structure

```
backend/
├── config/               # Django project configuration
│   ├── settings/
│   │   ├── base.py          # Shared settings
│   │   ├── development.py   # Dev overrides (SQLite, debug)
│   │   └── production.py    # Prod overrides (PostgreSQL, security)
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── accounts/          # Custom User model, auth, profiles
│   └── reputation/        # Votes & Comments
├── api/                   # Root API URL routing
├── media/                 # User-uploaded files
├── manage.py
├── requirements.txt
└── README.md
```

## API Endpoints

### Authentication

| Method | Endpoint               | Auth     | Description          |
|--------|------------------------|----------|----------------------|
| POST   | `/api/auth/register`   | ✗        | Register new user    |
| POST   | `/api/auth/login`      | ✗        | Obtain JWT tokens    |
| POST   | `/api/auth/refresh`    | ✗        | Refresh access token |
| GET    | `/api/auth/me`         | ✓        | Current user profile |

### Users

| Method | Endpoint                     | Auth | Description              |
|--------|------------------------------|------|--------------------------|
| GET    | `/api/users/search?q=`       | ✓    | Search users by username |
| GET    | `/api/users/<username>`      | ✓    | View user profile        |

### Votes

| Method | Endpoint         | Auth | Description     |
|--------|------------------|------|-----------------|
| POST   | `/api/votes/`    | ✓    | Submit a vote   |

### History

| Method | Endpoint                    | Auth | Description          |
|--------|-----------------------------|------|----------------------|
| GET    | `/api/votes/history/given`  | ✓    | Votes I gave         |
| GET    | `/api/votes/history/received`| ✓    | Votes I received     |

## API Examples

### Register

```bash
curl -X POST http://127.0.0.1:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "secret1234"}'
```

### Login

```bash
curl -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "secret1234"}'
```

Response:

```json
{
  "access": "eyJ...",
  "refresh": "eyJ..."
}
```

### Use token

```bash
curl -H "Authorization: Bearer <access_token>" http://127.0.0.1:8000/api/auth/me
```

### Create a vote

```bash
curl -X POST http://127.0.0.1:8000/api/votes/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"to_user": 2, "vote_type": 1, "comment": {"text": "Great user!"}}'
```

### Search users

```bash
curl "http://127.0.0.1:8000/api/users/search?q=ali" \
  -H "Authorization: Bearer <access_token>"
```

## Admin Panel

Visit `/admin/` to manage Users, Votes, and Comments.
