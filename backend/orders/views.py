from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.db import transaction

from .models import Order, OrderItem
from carts.models import CartItem, Cart
from products.models import Product
from .serializers import OrderSerializer

class UserOrderListAPIView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False) or not self.request.user.is_authenticated:
            return Order.objects.none()
        # Return orders of the logged-in user
        return Order.objects.filter(user=self.request.user).order_by("-created_at")

class OrderCreateAPIView(generics.CreateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        items = request.data.get("items", [])

        if not items:
            return Response(
                {"error": "No items provided"},
                status=status.HTTP_400_BAD_REQUEST
            )

        required_fields = ["phone", "address", "city", "state", "country"]
        missing = [field for field in required_fields if not request.data.get(field)]
        if missing:
            return Response(
                {"error": f"Missing required shipping fields: {', '.join(missing)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 1️⃣ Get user cart (if exists)
        cart = Cart.objects.filter(user=request.user).first()

        # 2️⃣ Stock & quantity validation (before order)
        validated_items = []
        for item in items:
            try:
                product = Product.objects.select_for_update().get(id=item["product"])
                quantity = int(item["quantity"])
            except (Product.DoesNotExist, KeyError, TypeError, ValueError):
                return Response(
                    {"error": "Invalid product or quantity provided"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if quantity < 1:
                return Response(
                    {"error": "Quantity must be at least 1"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if quantity > product.stock:
                return Response(
                    {"error": f"{product.name} has only {product.stock} items in stock"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            validated_items.append((product, quantity))

        # 3️⃣ Create Order
        order = Order.objects.create(
            user=request.user,
            name=request.data.get("name"),
            phone=request.data.get("phone"),
            address=request.data.get("address"),
            city=request.data.get("city"),
            state=request.data.get("state"),
            country=request.data.get("country"),
        )

        # 4️⃣ Create OrderItems + Update Stock + Remove from Cart
        for product, quantity in validated_items:
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                price=product.price * quantity
            )

            product.stock -= quantity
            product.save()

            if cart:
                CartItem.objects.filter(
                    cart=cart,
                    product=product
                ).delete()

        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
