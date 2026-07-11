from django.urls import path
from . import views

urlpatterns = [
    path('', views.CreateVoteView.as_view(), name='create-vote'),
    path('history/given', views.HistoryGivenView.as_view(), name='history-given'),
    path('history/received', views.HistoryReceivedView.as_view(), name='history-received'),
]
