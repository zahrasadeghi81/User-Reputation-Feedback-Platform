import json
import random

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db import IntegrityError
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import Feedback, Profile

EMOJIS = ["🫘", "🧙‍♀️", "🏍️", "⭐", "😼", "💫", "🌑", "🌬️", "🌿", "✨"]
COLORS = ["#2e1a5a", "#2d1b5a", "#0e3a4f", "#4a1040", "#0d3d2a", "#3d2800", "#1a1855", "#1a3540", "#1a3520"]


def body_json(request):
    try:
        return json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return {}


def error(message, status=400, field=None):
    payload = {"error": message}
    if field:
        payload["field"] = field
    return JsonResponse(payload, status=status)


def ensure_profile(user):
    profile, _ = Profile.objects.get_or_create(
        user=user,
        defaults={"emoji": random.choice(EMOJIS), "bg_color": random.choice(COLORS)},
    )
    return profile


def serialize_user(user):
    profile = ensure_profile(user)
    return {
        "id": str(user.id),
        "username": user.username,
        "score": profile.score,
        "emoji": profile.emoji,
        "bgColor": profile.bg_color,
        "dateJoined": user.date_joined.strftime("%B %Y"),
    }


def serialize_feedback(item, include_to=False):
    payload = {
        "id": str(item.id),
        "from": serialize_user(item.from_user),
        "score": item.score,
        "comment": item.comment,
        "date": timezone.localtime(item.created_at).strftime("%b %-d, %Y"),
    }
    if include_to:
        payload["to"] = serialize_user(item.to_user)
    return payload


def require_auth(request):
    if not request.user.is_authenticated:
        return error("Authentication required", 401)
    return None


@require_http_methods(["GET"])
def me(request):
    auth_error = require_auth(request)
    if auth_error:
        return auth_error

    received = Feedback.objects.filter(to_user=request.user)[:10]
    return JsonResponse({"user": serialize_user(request.user), "recentFeedback": [serialize_feedback(item) for item in received]})


@csrf_exempt
@require_http_methods(["POST"])
def login_view(request):
    data = body_json(request)
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    user = authenticate(request, username=username, password=password)
    if user is None:
        return error("Invalid username or password", 400)

    login(request, user)
    ensure_profile(user)
    return JsonResponse({"user": serialize_user(user)})


@csrf_exempt
@require_http_methods(["POST"])
def logout_view(request):
    logout(request)
    return JsonResponse({"ok": True})


@csrf_exempt
@require_http_methods(["POST"])
def register_view(request):
    data = body_json(request)
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if len(username) < 3:
        return error("Must be at least 3 characters", field="username")
    if len(password) < 6:
        return error("Must be at least 6 characters", field="password")

    try:
        user = User.objects.create_user(username=username, password=password)
    except IntegrityError:
        return error("Username is already taken", field="username")

    ensure_profile(user)
    return JsonResponse({"user": serialize_user(user)}, status=201)


@require_http_methods(["GET"])
def users_view(request):
    auth_error = require_auth(request)
    if auth_error:
        return auth_error

    query = (request.GET.get("q") or "").strip()
    users = User.objects.exclude(id=request.user.id).order_by("username")
    if query:
        users = users.filter(username__icontains=query)
    else:
        users = users.none()
    return JsonResponse({"users": [serialize_user(user) for user in users[:25]]})


@require_http_methods(["GET"])
def user_detail_view(request, user_id):
    auth_error = require_auth(request)
    if auth_error:
        return auth_error

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return error("User not found", 404)

    feedback = Feedback.objects.filter(to_user=user)[:50]
    return JsonResponse({"user": serialize_user(user), "feedback": [serialize_feedback(item) for item in feedback]})


@csrf_exempt
@require_http_methods(["POST"])
def feedback_create_view(request):
    auth_error = require_auth(request)
    if auth_error:
        return auth_error

    data = body_json(request)
    to_user_id = data.get("toUserId")
    score = data.get("score")
    comment = (data.get("comment") or "").strip()

    if score not in (1, -1):
        return error("Score must be +1 or -1")
    if not comment:
        return error("Comment is required", field="comment")
    if len(comment) > 280:
        return error("Comment must be 280 characters or fewer", field="comment")

    try:
        to_user = User.objects.get(id=to_user_id)
    except (User.DoesNotExist, ValueError, TypeError):
        return error("Target user not found", 404)

    if to_user == request.user:
        return error("You cannot leave feedback for yourself")

    item = Feedback.objects.create(from_user=request.user, to_user=to_user, score=score, comment=comment)
    return JsonResponse({"feedback": serialize_feedback(item, include_to=True), "user": serialize_user(to_user)}, status=201)


@require_http_methods(["GET"])
def feedback_history_view(request):
    auth_error = require_auth(request)
    if auth_error:
        return auth_error

    received = Feedback.objects.filter(to_user=request.user)[:50]
    given = Feedback.objects.filter(from_user=request.user).select_related("to_user")[:50]
    return JsonResponse({
        "received": [serialize_feedback(item) for item in received],
        "given": [serialize_feedback(item, include_to=True) for item in given],
    })
