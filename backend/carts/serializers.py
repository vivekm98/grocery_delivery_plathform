from rest_framework import serializers
from .models import Cart, CartItem

from products.serializers import ProductSerializer

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    unit_name = serializers.CharField(source="product.unit.name", read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'quantity',"unit_name",]

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'items']


class AddToCartSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(required=True, help_text="ID of the product to add to cart")
    quantity = serializers.IntegerField(default=1, min_value=1, help_text="Quantity to add")


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(required=True, min_value=1, help_text="New quantity of item")

