from .models import Vote


class VoteService:

    @staticmethod
    def get_given_votes(user):
        return Vote.objects.filter(from_user=user).select_related(
            'to_user', 'comment'
        ).order_by('-created_at')

    @staticmethod
    def get_received_votes(user):
        return Vote.objects.filter(to_user=user).select_related(
            'from_user', 'comment'
        ).order_by('-created_at')
