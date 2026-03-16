from django.db import models
from django.utils import timezone
from django.utils.text import slugify
from django.conf import settings


# ─────────────────────────────────────────────
#  SHARED / UTILITY
# ─────────────────────────────────────────────

class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


# ─────────────────────────────────────────────
#  CHURCH LEADERSHIP
# ─────────────────────────────────────────────

class ChurchLeader(TimeStampedModel):
    first_name    = models.CharField(max_length=100)
    last_name     = models.CharField(max_length=100)
    position      = models.CharField(max_length=150, help_text="e.g. Senior Pastor, Elder, Deacon")
    profile_image = models.ImageField(upload_to="leadership/photos/", blank=True, null=True)
    details       = models.TextField(blank=True, help_text="Bio / short description")
    is_active     = models.BooleanField(default=True)

    class Meta:
        ordering            = ["last_name", "first_name"]
        verbose_name        = "Church Leader"
        verbose_name_plural = "Church Leaders"

    def __str__(self):
        return f"{self.first_name} {self.last_name} — {self.position}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class ChurchLeaderContact(TimeStampedModel):
    leader          = models.OneToOneField(ChurchLeader, on_delete=models.CASCADE, related_name="contact")
    phone_number_1  = models.CharField(max_length=20, blank=True)
    phone_number_2  = models.CharField(max_length=20, blank=True)
    email_address_1 = models.EmailField(blank=True)
    email_address_2 = models.EmailField(blank=True)
    facebook        = models.URLField(blank=True, verbose_name="Facebook Account")
    x_twitter       = models.URLField(blank=True, verbose_name="X (Twitter) Account")
    youtube         = models.URLField(blank=True, verbose_name="YouTube Channel")
    tiktok          = models.URLField(blank=True, verbose_name="TikTok Account")
    instagram       = models.URLField(blank=True, verbose_name="Instagram Account")
    whatsapp        = models.CharField(max_length=20, blank=True, help_text="WhatsApp number with country code")

    class Meta:
        verbose_name        = "Leader Contact"
        verbose_name_plural = "Leader Contacts"

    def __str__(self):
        return f"Contacts — {self.leader.full_name}"


# ─────────────────────────────────────────────
#  BLOGS
# ─────────────────────────────────────────────

class BlogTag(TimeStampedModel):
    title = models.CharField(max_length=80, unique=True)
    slug  = models.SlugField(max_length=90, unique=True, blank=True)

    class Meta:
        ordering            = ["title"]
        verbose_name        = "Blog Tag"
        verbose_name_plural = "Blog Tags"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class Blog(TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT     = "draft",     "Draft"
        PUBLISHED = "published", "Published"

    title        = models.CharField(max_length=255)
    slug         = models.SlugField(max_length=270, unique=True, blank=True)
    cover_image  = models.ImageField(upload_to="blogs/", blank=True, null=True)
    description  = models.TextField(help_text="Full blog content / info")
    status       = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    published_at = models.DateTimeField(null=True, blank=True)
    tags         = models.ManyToManyField(BlogTag, blank=True, related_name="blogs")

    class Meta:
        ordering            = ["-published_at", "-created_at"]
        verbose_name        = "Blog"
        verbose_name_plural = "Blogs"

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            n = 1
            while Blog.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{n}"
                n += 1
            self.slug = slug
        if self.status == self.Status.PUBLISHED and not self.published_at:
            self.published_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


# ─────────────────────────────────────────────
#  EVENTS
# ─────────────────────────────────────────────

class Event(TimeStampedModel):
    class Status(models.TextChoices):
        UPCOMING = "upcoming", "Upcoming"
        ACTIVE   = "active",   "Active"
        FINISHED = "finished", "Finished"

    title            = models.CharField(max_length=255)
    slug             = models.SlugField(max_length=270, unique=True, blank=True)
    location_address = models.CharField(max_length=255, blank=True)
    details          = models.TextField(blank=True)
    cover_image      = models.ImageField(upload_to="events/covers/", blank=True, null=True)
    pub_date         = models.DateField(help_text="Date this event is published/announced")
    start_date       = models.DateField()
    end_date         = models.DateField(null=True, blank=True)
    start_time       = models.TimeField(null=True, blank=True)
    end_time         = models.TimeField(null=True, blank=True)
    status           = models.CharField(max_length=10, choices=Status.choices, default=Status.UPCOMING)

    class Meta:
        ordering            = ["-start_date", "start_time"]
        verbose_name        = "Event"
        verbose_name_plural = "Events"

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            n = 1
            while Event.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{n}"
                n += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.start_date})"


# ─────────────────────────────────────────────
#  SERVICES / PRAYERS
# ─────────────────────────────────────────────

class Service(TimeStampedModel):
    class DayOfWeek(models.IntegerChoices):
        MONDAY    = 0, "Monday"
        TUESDAY   = 1, "Tuesday"
        WEDNESDAY = 2, "Wednesday"
        THURSDAY  = 3, "Thursday"
        FRIDAY    = 4, "Friday"
        SATURDAY  = 5, "Saturday"
        SUNDAY    = 6, "Sunday"

    title          = models.CharField(max_length=255)
    start_time     = models.TimeField()
    end_time       = models.TimeField(null=True, blank=True)
    lasts_for      = models.DurationField(null=True, blank=True, help_text="Optional duration e.g. 1:30:00")
    details        = models.TextField(blank=True)
    is_single_day  = models.BooleanField(default=False)
    runs_every_day = models.BooleanField(default=False)
    start_day      = models.DateField(null=True, blank=True)
    end_day        = models.DateField(null=True, blank=True)
    day_of_week    = models.IntegerField(choices=DayOfWeek.choices, null=True, blank=True)

    class Meta:
        ordering            = ["day_of_week", "start_time"]
        verbose_name        = "Service / Prayer"
        verbose_name_plural = "Services / Prayers"

    def __str__(self):
        return f"{self.title} @ {self.start_time}"


# ─────────────────────────────────────────────
#  MINISTRY WORK
# ─────────────────────────────────────────────

class MinistryWork(TimeStampedModel):
    class WorkType(models.TextChoices):
        THANKSGIVING_CELEBRATION = "thanksgiving", "Thanksgiving & Celebration"
        GENERAL_MEETING          = "general",       "General Meeting"
        YOUTH_FELLOWSHIP         = "youth",         "Youth Fellowship"
        CHILDREN_FELLOWSHIP      = "children",      "Children Fellowship"
        OTHER                    = "other",          "Other"

    title   = models.CharField(max_length=255)
    date    = models.DateField()
    time    = models.TimeField(null=True, blank=True)
    type    = models.CharField(max_length=20, choices=WorkType.choices, default=WorkType.OTHER)
    details = models.TextField(blank=True)

    class Meta:
        ordering            = ["-date"]
        verbose_name        = "Ministry Work"
        verbose_name_plural = "Ministry Works"

    def __str__(self):
        return f"{self.title} — {self.get_type_display()} ({self.date})"


# ─────────────────────────────────────────────
#  GALLERY
# ─────────────────────────────────────────────

class GalleryImage(TimeStampedModel):
    ministry_work = models.ForeignKey(
        MinistryWork, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="gallery_images"
    )
    image   = models.ImageField(upload_to="gallery/")
    caption = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering            = ["-created_at"]
        verbose_name        = "Gallery Image"
        verbose_name_plural = "Gallery Images"

    def __str__(self):
        if self.ministry_work:
            return f"Photo — {self.ministry_work.title}"
        return f"Gallery Photo #{self.pk}"


# ─────────────────────────────────────────────
#  THANKSGIVING & TESTIMONIALS
# ─────────────────────────────────────────────

class Testimony(TimeStampedModel):
    name        = models.CharField(max_length=150)
    picture     = models.ImageField(upload_to="testimonials/photos/", blank=True, null=True)
    message     = models.TextField()
    date        = models.DateField(default=timezone.now)
    time        = models.TimeField(null=True, blank=True)
    is_approved = models.BooleanField(default=False)

    class Meta:
        ordering            = ["-date", "-time"]
        verbose_name        = "Testimony"
        verbose_name_plural = "Testimonies"

    def __str__(self):
        return f"Testimony by {self.name} on {self.date}"


# ─────────────────────────────────────────────
#  ACTIVITY LOGS
# ─────────────────────────────────────────────

class ActivityLog(TimeStampedModel):
    ACTION_CHOICES = [
        ("CREATE",     "Created"),
        ("UPDATE",     "Updated"),
        ("DELETE",     "Deleted"),
        ("ACTIVATE",   "Activated"),
        ("DEACTIVATE", "Deactivated"),
        ("PUBLISH",    "Published"),
        ("DRAFT",      "Set to Draft"),
        ("APPROVE",    "Approved"),
        ("REVOKE",     "Revoked"),
        ("LOGIN",      "Logged In"),
        ("LOGOUT",     "Logged Out"),
        ("STAFF_ADD",  "Granted Staff"),
        ("STAFF_REM",  "Revoked Staff"),
    ]

    user        = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="activity_logs"
    )
    action      = models.CharField(max_length=20, choices=ACTION_CHOICES)
    model_name  = models.CharField(max_length=100, blank=True)
    object_id   = models.PositiveIntegerField(null=True, blank=True)
    object_repr = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    ip_address  = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering            = ["-created_at"]
        verbose_name        = "Activity Log"
        verbose_name_plural = "Activity Logs"

    def __str__(self):
        return f"{self.user} — {self.action} {self.model_name} at {self.created_at:%Y-%m-%d %H:%M}"