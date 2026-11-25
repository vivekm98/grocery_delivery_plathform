from rest_framework import serializers
from .models import Subscription

from products.serializers import ProductSerializer

class SubscriptionSerializer(serializers.ModelSerializer):
    product_detail = ProductSerializer(source="product", read_only=True)

    class Meta:
        model = Subscription
        fields = ["id", "user", "product", "product_detail", "frequency", "next_delivery_date"]
        read_only_fields = ["id", "user"]
