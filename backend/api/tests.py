from datetime import date, timedelta
from django.contrib.auth.models import User
from django.core import mail
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import EmailOTP
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

    def test_register_requires_valid_otp_and_rejects_duplicate_email(self):
        # 1. Send OTP for registration
        send_res = self.client.post(
            "/api/otp/send/",
            {"email": "newbuyer@example.com", "purpose": "register"},
            format="json",
        )
        self.assertEqual(send_res.status_code, status.HTTP_200_OK)
        otp_obj = EmailOTP.objects.get(email="newbuyer@example.com", is_used=False)

        # 2. Wrong OTP is rejected
        bad_reg = self.client.post(
            "/api/register/",
            {
                "username": "newbuyer",
                "email": "newbuyer@example.com",
                "password": "password123",
                "otp": "000000" if otp_obj.otp != "000000" else "111111",
            },
            format="json",
        )
        self.assertEqual(bad_reg.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. Valid OTP creates user with Full Name and auto-generated username
        res = self.client.post(
            "/api/register/",
            {
                "full_name": "New Buyer",
                "email": "newbuyer@example.com",
                "password": "password123",
                "otp": otp_obj.otp,
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        created_user = User.objects.get(email="newbuyer@example.com")
        self.assertEqual(created_user.first_name, "New")
        self.assertEqual(created_user.last_name, "Buyer")
        self.assertTrue(created_user.username.startswith("newbuyer"))

        # 4. Duplicate email rejected on send OTP for register
        dup = self.client.post(
            "/api/otp/send/",
            {"email": "newbuyer@example.com", "purpose": "register"},
            format="json",
        )
        self.assertEqual(dup.status_code, status.HTTP_400_BAD_REQUEST)

    def test_forgot_password_with_email_otp(self):
        # 1. Request reset OTP
        send_res = self.client.post(
            "/api/otp/send/",
            {"email": "vicky@example.com", "purpose": "reset"},
            format="json",
        )
        self.assertEqual(send_res.status_code, status.HTTP_200_OK)
        otp_obj = EmailOTP.objects.get(email="vicky@example.com", is_used=False)

        # 2. Reset password with OTP
        reset_res = self.client.post(
            "/api/password/reset/",
            {
                "email": "vicky@example.com",
                "otp": otp_obj.otp,
                "new_password": "newstrongpassword456",
            },
            format="json",
        )
        self.assertEqual(reset_res.status_code, status.HTTP_200_OK)

        # 3. Login with email & new password works
        login_res = self.client.post(
            "/api/token/",
            {"username": "vicky@example.com", "password": "newstrongpassword456"},
            format="json",
        )
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertIn("access", login_res.data)

    def test_profile_retrieve_and_update(self):
        self.authenticate(self.user)
        get_res = self.client.get("/api/profile/")
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(get_res.data["username"], "vicky")

        patch_res = self.client.patch(
            "/api/profile/",
            {"first_name": "Vicky", "last_name": "More", "phone": "9988776655"},
            format="json",
        )
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data["first_name"], "Vicky")
        self.assertEqual(patch_res.data["phone"], "9988776655")

    def test_logout_blacklists_refresh_token(self):
        login_res = self.client.post(
            "/api/token/",
            {"username": "vicky", "password": "strongpassword123"},
        )
        refresh_token = login_res.data["refresh"]
        self.authenticate(self.user)

        logout_res = self.client.post(
            "/api/logout/",
            {"refresh": refresh_token},
            format="json",
        )
        self.assertEqual(logout_res.status_code, status.HTTP_200_OK)

        # Blacklisted refresh token cannot be used again
        refresh_res = self.client.post(
            "/api/token/refresh/",
            {"refresh": refresh_token},
            format="json",
        )
        self.assertEqual(refresh_res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_otp_resend_cooldown_enforced(self):
        first = self.client.post(
            "/api/otp/send/",
            {"email": "cooldown@example.com"},
            format="json",
        )
        self.assertEqual(first.status_code, status.HTTP_200_OK)

        second = self.client.post(
            "/api/otp/send/",
            {"email": "cooldown@example.com"},
            format="json",
        )
        self.assertEqual(second.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_jwt_login_with_username_and_email(self):
        # Login with username
        res = self.client.post(
            "/api/token/",
            {"username": "vicky", "password": "strongpassword123"},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)
        self.assertEqual(res.data["user"]["username"], "vicky")

        # Login with email (case-insensitive)
        email_res = self.client.post(
            "/api/token/",
            {"username": "VICKY@example.com", "password": "strongpassword123"},
        )
        self.assertEqual(email_res.status_code, status.HTTP_200_OK)
        self.assertIn("access", email_res.data)
        self.assertEqual(email_res.data["user"]["email"], "vicky@example.com")

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

    def test_send_and_verify_email_otp_login(self):
        send_res = self.client.post(
            "/api/otp/send/",
            {"email": "vicky@example.com"},
            format="json",
        )
        self.assertEqual(send_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)

        otp_obj = EmailOTP.objects.get(email="vicky@example.com", is_used=False)

        # Wrong OTP fails
        bad_res = self.client.post(
            "/api/otp/verify/",
            {"email": "vicky@example.com", "otp": "000000" if otp_obj.otp != "000000" else "111111"},
            format="json",
        )
        self.assertEqual(bad_res.status_code, status.HTTP_400_BAD_REQUEST)

        # Valid OTP issues JWT tokens
        ok_res = self.client.post(
            "/api/otp/verify/",
            {"email": "vicky@example.com", "otp": otp_obj.otp},
            format="json",
        )
        self.assertEqual(ok_res.status_code, status.HTTP_200_OK)
        self.assertTrue(ok_res.data["verified"])
        self.assertIn("access", ok_res.data)
        self.assertIn("refresh", ok_res.data)
