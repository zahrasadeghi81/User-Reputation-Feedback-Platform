from rest_framework import status
from rest_framework.generics import GenericAPIView, ListAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from .serializers import (
    RegisterSerializer,
    UserSearchSerializer,
    UserProfileSerializer,
    UserPhotoSerializer,
)
from .services import UserService


class RegisterView(GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {'id': user.id, 'username': user.username},
            status=status.HTTP_201_CREATED,
        )


class MeView(GenericAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserProfileSerializer

    def get(self, request):
        serializer = self.get_serializer(request.user)
        score = UserService.calculate_score(request.user)
        feedback = UserService.get_recent_feedback(request.user)
        data = serializer.data
        data['calculated_score'] = score
        data['recent_feedback'] = [
            {
                'sender_username': v.from_user.username,
                'sender_avatar': (
                    v.from_user.profile_photo.url
                    if v.from_user.profile_photo else None
                ),
                'vote_type': v.vote_type,
                'comment': v.comment.text if hasattr(v, 'comment') else None,
                'date': v.created_at,
            }
            for v in feedback
        ]
        return Response(data)


class ProfileView(GenericAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserProfileSerializer

    def get(self, request, username):
        from .models import User
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response(
                {'detail': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = self.get_serializer(user)
        score = UserService.calculate_score(user)
        feedback = UserService.get_recent_feedback(user)
        data = serializer.data
        data['calculated_score'] = score
        data['recent_feedback'] = [
            {
                'sender_username': v.from_user.username,
                'sender_avatar': (
                    v.from_user.profile_photo.url
                    if v.from_user.profile_photo else None
                ),
                'vote_type': v.vote_type,
                'comment': v.comment.text if hasattr(v, 'comment') else None,
                'date': v.created_at,
            }
            for v in feedback
        ]
        return Response(data)


class UserSearchView(ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserSearchSerializer

    def get_queryset(self):
        query = self.request.query_params.get('q', '')
        if not query:
            return UserService.search_users('').none()
        return UserService.search_users(query)


class UpdatePhotoView(GenericAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserPhotoSerializer
    parser_classes = (MultiPartParser, FormParser)

    def patch(self, request):
        serializer = self.get_serializer(
            request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
