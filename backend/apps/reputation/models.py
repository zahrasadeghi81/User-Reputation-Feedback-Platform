from django.db import models
from django.conf import settings


class Vote(models.Model):
    from_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='votes_given',
    )
    to_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='votes_received',
    )
    vote_type = models.SmallIntegerField(choices=((1, '+1'), (-1, '-1')))
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['from_user', 'to_user'],
                name='unique_vote_per_user_pair',
            ),
            models.CheckConstraint(
                condition=models.Q(vote_type__in=(1, -1)),
                name='vote_type_valid',
            ),
        ]

    def __str__(self):
        return f'{self.from_user} -> {self.to_user}: {self.vote_type}'


class Comment(models.Model):
    vote = models.OneToOneField(
        Vote,
        on_delete=models.CASCADE,
        related_name='comment',
    )
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Comment on vote #{self.vote_id}'
