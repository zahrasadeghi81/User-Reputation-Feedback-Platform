from django.urls import path

from . import views

urlpatterns = [
    path("auth/me/", views.me),
    path("auth/login/", views.login_view),
    path("auth/logout/", views.logout_view),
    path("auth/register/", views.register_view),
    path("users/", views.users_view),
    path("users/<int:user_id>/", views.user_detail_view),
    path("feedback/", views.feedback_create_view),
    path("feedback/history/", views.feedback_history_view),
]
