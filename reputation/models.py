from django.conf import settings
from django.db import models
from django.db.models import Sum


class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    emoji = models.CharField(max_length=16, default="✨")
    bg_color = models.CharField(max_length=16, default="#2e1a5a")
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def score(self):
        return Feedback.objects.filter(to_user=self.user).aggregate(total=Sum("score"))["total"] or 0

    def __str__(self):
        return self.user.username


class Feedback(models.Model):
    POSITIVE = 1
    NEGATIVE = -1
    SCORE_CHOICES = ((POSITIVE, "+1"), (NEGATIVE, "-1"))

    from_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="feedback_given")
    to_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="feedback_received")
    score = models.SmallIntegerField(choices=SCORE_CHOICES)
    comment = models.TextField(max_length=280)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.from_user} -> {self.to_user}: {self.score}"
