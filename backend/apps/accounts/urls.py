from django.urls import path
from . import views

urlpatterns = [
    path('me', views.MeView.as_view(), name='me'),
    path('me/photo', views.UpdatePhotoView.as_view(), name='me-photo'),
    path('search', views.UserSearchView.as_view(), name='user-search'),
    path('<str:username>', views.ProfileView.as_view(), name='profile'),
]
