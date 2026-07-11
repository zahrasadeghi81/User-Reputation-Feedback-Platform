from django.db.models import Q, Sum
from apps.reputation.models import Vote


class UserService:

    @staticmethod
    def search_users(query: str):
        from .models import User
        return User.objects.filter(
            Q(username__icontains=query)
        )

    @staticmethod
    def calculate_score(user):
        result = Vote.objects.filter(to_user=user).aggregate(
            total=Sum('vote_type')
        )
        return result['total'] or 0

    @staticmethod
    def get_recent_feedback(user, limit=10):
        return Vote.objects.filter(to_user=user).select_related(
            'from_user', 'comment'
        ).order_by('-created_at')[:limit]
