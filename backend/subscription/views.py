
from rest_framework.permissions import IsAuthenticated
from .serializers import SubscriptionSerializer
from rest_framework import generics
from .models import Subscription

# Create your views here.
class SubscriptionListView(generics.ListCreateAPIView):
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False) or not self.request.user.is_authenticated:
            return Subscription.objects.none()
        return Subscription.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SubscriptionRetrieveView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False) or not self.request.user.is_authenticated:
            return Subscription.objects.none()
        return Subscription.objects.filter(user=self.request.user)
