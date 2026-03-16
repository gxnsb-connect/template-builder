from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone


# ================= USER TYPE CHOICES =================
class UserType(models.TextChoices):
    STAFF     = "staff",     "Staff"
    ADMIN     = "admin",     "Admin"
    SYS_ADMIN = "sys_admin", "System Admin"
    CHURCH_MEMBER = "church_member", "Church Member"


# ================= USER MANAGER =================
class CustomUserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        if not username:
            raise ValueError("Username is required")

        email = self.normalize_email(email)
        user  = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff",          True)
        extra_fields.setdefault("is_superuser",      True)
        extra_fields.setdefault("is_active",         True)
        extra_fields.setdefault("is_email_verified", True)
        extra_fields.setdefault("user_type",         UserType.SYS_ADMIN)
        extra_fields.setdefault("password_changed_on_temp_key_access", False)
        return self.create_user(username, email, password, **extra_fields)


# ================= USER MODEL =================
GENDER_CHOICES = [
    ("male",            "Male"),
    ("female",          "Female"),
    ("other",           "Other"),
    ("prefer_not_to_say", "Prefer not to say"),
]


class CustomUser(AbstractBaseUser, PermissionsMixin):
    username     = models.CharField(max_length=150, unique=True)
    email        = models.EmailField(unique=True)
    first_name   = models.CharField(max_length=100)
    last_name    = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20, unique=True)
    country      = models.CharField(max_length=100)
    gender       = models.CharField(max_length=20, choices=GENDER_CHOICES)

    # ── Auth / Status ──────────────────────────────────────────────────────
    is_active          = models.BooleanField(default=False)
    is_staff           = models.BooleanField(default=False)
    is_email_verified  = models.BooleanField(default=False)

    # ── Role ──────────────────────────────────────────────────────────────
    user_type = models.CharField(
        max_length=20,
        choices=UserType.choices,
        default=UserType.ADMIN,
    )

    # ── Setup key (stored hashed, cleared after first login setup) ─────────
    setupkey = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        editable=False,
        help_text="Hashed one-time setup key sent to staff on account creation.",
    )

    # ── Tracks whether the user still needs to set a permanent password ────
    password_changed_on_temp_key_access = models.BooleanField(
        default=True,
        help_text=(
            "True means the user has NOT yet changed their password after "
            "setup-key activation. Set to False once they complete setup."
        ),
    )

    date_joined = models.DateTimeField(default=timezone.now)

    objects = CustomUserManager()

    USERNAME_FIELD  = "username"
    REQUIRED_FIELDS = ["email"]

    def __str__(self):
        return self.username

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    class Meta:
        verbose_name        = "User"
        verbose_name_plural = "Users"