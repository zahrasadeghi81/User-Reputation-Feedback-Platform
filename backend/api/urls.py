from django.urls import path, include

urlpatterns = [
    path('auth/', include('apps.accounts.auth_urls')),
    path('users/', include('apps.accounts.urls')),
    path('votes/', include('apps.reputation.urls')),
]
