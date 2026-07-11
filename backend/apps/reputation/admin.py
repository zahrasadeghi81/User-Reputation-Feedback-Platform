from django.contrib import admin
from .models import Vote, Comment


class CommentInline(admin.StackedInline):
    model = Comment
    can_delete = True


@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ('id', 'from_user', 'to_user', 'vote_type', 'created_at')
    list_filter = ('vote_type', 'created_at')
    search_fields = ('from_user__username', 'to_user__username')
    inlines = (CommentInline,)


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'vote', 'truncated_text', 'created_at')

    def truncated_text(self, obj):
        return obj.text[:75] + '...' if len(obj.text) > 75 else obj.text
    truncated_text.short_description = 'text'
