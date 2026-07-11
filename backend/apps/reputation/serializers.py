from rest_framework import serializers
from .models import Vote, Comment


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ('text', 'created_at')
        read_only_fields = ('created_at',)


class VoteSerializer(serializers.ModelSerializer):
    comment = CommentSerializer()

    class Meta:
        model = Vote
        fields = ('id', 'from_user', 'to_user', 'vote_type', 'comment', 'created_at')
        read_only_fields = ('id', 'from_user', 'created_at')

    def validate(self, attrs):
        request = self.context.get('request')
        from_user = request.user
        to_user = attrs.get('to_user')

        if from_user == to_user:
            raise serializers.ValidationError('You cannot vote for yourself.')

        if Vote.objects.filter(from_user=from_user, to_user=to_user).exists():
            raise serializers.ValidationError('You have already voted for this user.')

        return attrs

    def create(self, validated_data):
        comment_data = validated_data.pop('comment')
        validated_data['from_user'] = self.context['request'].user
        vote = Vote.objects.create(**validated_data)
        Comment.objects.create(vote=vote, **comment_data)
        return vote


class HistorySerializer(serializers.ModelSerializer):
    comment = CommentSerializer(read_only=True)
    from_user_username = serializers.CharField(source='from_user.username', read_only=True)
    from_user_avatar = serializers.ImageField(source='from_user.profile_photo', read_only=True)
    to_user_username = serializers.CharField(source='to_user.username', read_only=True)
    to_user_avatar = serializers.ImageField(source='to_user.profile_photo', read_only=True)

    class Meta:
        model = Vote
        fields = (
            'id', 'from_user_username', 'from_user_avatar',
            'to_user_username', 'to_user_avatar',
            'vote_type', 'comment', 'created_at',
        )
