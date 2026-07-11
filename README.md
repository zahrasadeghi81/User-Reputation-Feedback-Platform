# User Reputation Feedback Platform

A React/Vite frontend connected to a Django backend for user registration, login, search, reputation feedback, and feedback history.

## Setup

Install frontend dependencies:

```bash
npm i
```

Install backend dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
```

## Run in development

Terminal 1, Django API:

```bash
source .venv/bin/activate
python manage.py runserver
```

Terminal 2, React UI:

```bash
npm run dev
```

Open the Vite URL. API calls to `/api/...` are proxied to Django.

## Optional production-style build

```bash
npm run build
python manage.py runserver
```

After building, Django serves the Vite `dist/index.html` shell and static assets.
