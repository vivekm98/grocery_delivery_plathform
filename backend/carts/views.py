from rest_framework import generics, permissions, status
from rest_framework.response import Response

from .models import Cart, CartItem
from products.models import Product
from .serializers import CartSerializer, CartItemSerializer, AddToCartSerializer, UpdateCartItemSerializer

# Create your views here.
def get_user_cart(user):
    cart, created = Cart.objects.get_or_create(user=user)
    return cart

class CartView(generics.RetrieveAPIView):
    serializer_class = CartSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return get_user_cart(self.request.user)


class AddToCartView(generics.CreateAPIView):
    serializer_class = AddToCartSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product_id = serializer.validated_data["product_id"]
        quantity = serializer.validated_data["quantity"]

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

        # 🔥 STOCK CHECK
        if quantity > product.stock:
            return Response(
                {
                    "error": f"Only {product.stock} items available in stock"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        cart = get_user_cart(request.user)

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product
        )

        new_quantity = quantity if created else cart_item.quantity + quantity

        # 🔥 TOTAL STOCK CHECK
        if new_quantity > product.stock:
            return Response(
                {
                    "error": f"Total quantity cannot exceed available stock ({product.stock})"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        cart_item.quantity = new_quantity
        cart_item.save()

        return Response(
            CartSerializer(cart).data,
            status=status.HTTP_201_CREATED
        )

class UpdateCartItemView(generics.UpdateAPIView):
    serializer_class = UpdateCartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, item_id, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quantity = serializer.validated_data["quantity"]

        cart = get_user_cart(request.user)
        try:
            item = CartItem.objects.get(id=item_id, cart=cart)
        except CartItem.DoesNotExist:
            return Response({"error": "Cart item not found"}, status=status.HTTP_404_NOT_FOUND)

        item.quantity = quantity
        item.save()

        return Response({"message": "Quantity updated"})

class RemoveCartItemView(generics.DestroyAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, item_id, *args, **kwargs):
        cart = get_user_cart(request.user)
        try:
            item = CartItem.objects.get(id=item_id, cart=cart)
        except CartItem.DoesNotExist:
            return Response({"error": "Cart item not found"}, status=status.HTTP_404_NOT_FOUND)

        item.delete()

        return Response({"message": "Item removed"})
