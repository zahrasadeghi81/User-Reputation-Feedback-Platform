from rest_framework.generics import GenericAPIView, ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .serializers import VoteSerializer, HistorySerializer
from .services import VoteService


class CreateVoteView(GenericAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = VoteSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vote = serializer.save()
        return Response(
            HistorySerializer(vote, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class HistoryGivenView(ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = HistorySerializer

    def get_queryset(self):
        return VoteService.get_given_votes(self.request.user)


class HistoryReceivedView(ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = HistorySerializer

    def get_queryset(self):
        return VoteService.get_received_votes(self.request.user)
