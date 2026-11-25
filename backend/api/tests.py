from datetime import date, timedelta
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from products.models import Category, Product, Unit
from subscription.models import Subscription


class GroceryPlatformAPITests(APITestCase):
    """End-to-end API tests for auth, products, cart, orders, and subscriptions."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="vicky",
            email="vicky@example.com",
            password="strongpassword123",
        )
        self.other_user = User.objects.create_user(
            username="otheruser",
            email="other@example.com",
            password="strongpassword123",
        )
        self.category = Category.objects.create(
            name="Fresh Fruits",
            description="Organic fruits",
            image="category/fruits.jpg",
        )
        self.unit = Unit.objects.create(name="kg")
        self.product = Product.objects.create(
            name="Alphonso Mango",
            description="Sweet mangoes",
            price=120.0,
            category=self.category,
            unit=self.unit,
            stock=10,
        )

    def authenticate(self, user=None):
        target = user or self.user
        self.client.force_authenticate(user=target)

    def test_register_and_duplicate_email_rejected(self):
        res = self.client.post(
            "/api/register/",
            {
                "username": "newbuyer",
                "email": "newbuyer@example.com",
                "password": "password123",
            },
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        dup = self.client.post(
            "/api/register/",
            {
                "username": "anotherbuyer",
                "email": "newbuyer@example.com",
                "password": "password123",
            },
        )
        self.assertEqual(dup.status_code, status.HTTP_400_BAD_REQUEST)

    def test_jwt_login(self):
        res = self.client.post(
            "/api/token/",
            {"username": "vicky", "password": "strongpassword123"},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)

    def test_non_admin_cannot_delete_category(self):
        self.authenticate()
        res = self.client.delete(f"/api/categories/{self.category.id}/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_cart_add_stock_validation_and_update(self):
        self.authenticate()
        # Exceeding stock fails
        over = self.client.post(
            "/api/cart/add/",
            {"product_id": self.product.id, "quantity": 50},
            format="json",
        )
        self.assertEqual(over.status_code, status.HTTP_400_BAD_REQUEST)

        # Valid add succeeds
        added = self.client.post(
            "/api/cart/add/",
            {"product_id": self.product.id, "quantity": 2},
            format="json",
        )
        self.assertEqual(added.status_code, status.HTTP_201_CREATED)
        item_id = added.data["items"][0]["id"]

        # Update quantity
        updated = self.client.put(
            f"/api/cart/update/{item_id}/",
            {"quantity": 3},
            format="json",
        )
        self.assertEqual(updated.status_code, status.HTTP_200_OK)

    def test_order_creation_decrements_stock_and_clears_cart(self):
        self.authenticate()
        self.client.post(
            "/api/cart/add/",
            {"product_id": self.product.id, "quantity": 2},
            format="json",
        )

        order_res = self.client.post(
            "/api/orders/create/",
            {
                "name": "Vicky",
                "phone": "9876543210",
                "address": "123 Green Street",
                "city": "Pune",
                "state": "MH",
                "country": "India",
                "items": [{"product": self.product.id, "quantity": 2}],
            },
            format="json",
        )
        self.assertEqual(order_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(order_res.data["status_name"], "Pending")

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 8)

        cart_res = self.client.get("/api/cart/")
        self.assertEqual(len(cart_res.data["items"]), 0)

    def test_subscription_user_isolation(self):
        sub = Subscription.objects.create(
            user=self.other_user,
            product=self.product,
            frequency="weekly",
            next_delivery_date=date.today() + timedelta(days=7),
        )
        self.authenticate(self.user)
        # User cannot retrieve or delete another user's subscription
        res = self.client.get(f"/api/subscription/{sub.id}/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        # User creates their own subscription
        create_res = self.client.post(
            "/api/subscription/",
            {
                "product": self.product.id,
                "frequency": "monthly",
                "next_delivery_date": (date.today() + timedelta(days=30)).isoformat(),
            },
            format="json",
        )
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_res.data["user"], self.user.id)
