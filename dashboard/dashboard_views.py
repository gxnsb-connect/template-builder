import re
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth import logout
from django.urls import reverse
from django.utils import timezone
from django.core.paginator import Paginator
from django.db.models import Q, Count

from .models import (
    ChurchLeader, ChurchLeaderContact, BlogTag, Blog,
    Event, Service, MinistryWork, GalleryImage, Testimony, ActivityLog,
)
from authentication.models import CustomUser
from authentication.utils import (
    COUNTRY_LIST, GENDER_CHOICES,
    _validate_name, _validate_email, _validate_phone,
    _validate_country, _validate_gender, _validate_username, _validate_password,
    generate_otp, send_otp_email, send_account_activated_email,
)


# ─────────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────────

def _staff_required(request):
    if not request.user.is_authenticated:
        messages.error(request, "Please log in to access this page.")
        return False
    if not request.user.is_staff:
        messages.error(request, "You do not have permission to access this page.")
        return False
    return True


def _log(request, action, model_name="", object_id=None, object_repr="", description=""):
    ActivityLog.objects.create(
        user=request.user if request.user.is_authenticated else None,
        action=action,
        model_name=model_name,
        object_id=object_id,
        object_repr=object_repr,
        description=description,
        ip_address=request.META.get("REMOTE_ADDR"),
    )


def _get_ip(request):
    return request.META.get("REMOTE_ADDR")


# ─────────────────────────────────────────────
#  DASHBOARD HOME
# ─────────────────────────────────────────────

def dashboard(request):
    if not _staff_required(request):
        return redirect(reverse("login"))

    stats = {
        "total_leaders":         ChurchLeader.objects.count(),
        "active_leaders":        ChurchLeader.objects.filter(is_active=True).count(),
        "total_blogs":           Blog.objects.count(),
        "published_blogs":       Blog.objects.filter(status="published").count(),
        "draft_blogs":           Blog.objects.filter(status="draft").count(),
        "upcoming_events":       Event.objects.filter(status="upcoming").count(),
        "active_events":         Event.objects.filter(status="active").count(),
        "total_services":        Service.objects.count(),
        "total_ministry":        MinistryWork.objects.count(),
        "total_gallery":         GalleryImage.objects.count(),
        "total_testimonies":     Testimony.objects.count(),
        "pending_testimonies":   Testimony.objects.filter(is_approved=False).count(),
        "approved_testimonies":  Testimony.objects.filter(is_approved=True).count(),
        "total_staff":           CustomUser.objects.filter(is_staff=True).count(),
        "total_users":           CustomUser.objects.count(),
        "active_users":          CustomUser.objects.filter(is_active=True).count(),
    }

    recent_logs      = ActivityLog.objects.select_related("user").order_by("-created_at")[:8]
    recent_blogs     = Blog.objects.order_by("-created_at")[:5]
    upcoming_events  = Event.objects.filter(status="upcoming").order_by("start_date")[:5]
    pending_testimonies = Testimony.objects.filter(is_approved=False).order_by("-date")[:5]

    return render(request, "dashboard/home.html", {
        "stats":               stats,
        "recent_logs":         recent_logs,
        "recent_blogs":        recent_blogs,
        "upcoming_events":     upcoming_events,
        "pending_testimonies": pending_testimonies,
    })


# ─────────────────────────────────────────────
#  CHURCH LEADERS
# ─────────────────────────────────────────────

def leaders_list(request):
    if not _staff_required(request):
        return redirect(reverse("login"))

    q      = request.GET.get("q", "").strip()
    status = request.GET.get("status", "")

    leaders = ChurchLeader.objects.all()
    if q:
        leaders = leaders.filter(
            Q(first_name__icontains=q) | Q(last_name__icontains=q) | Q(position__icontains=q)
        )
    if status == "active":
        leaders = leaders.filter(is_active=True)
    elif status == "inactive":
        leaders = leaders.filter(is_active=False)

    paginator = Paginator(leaders, 12)
    page_obj  = paginator.get_page(request.GET.get("page", 1))

    return render(request, "dashboard/leaders/list.html", {
        "page_obj": page_obj,
        "q":        q,
        "status":   status,
        "total":    leaders.count(),
    })


def leader_add(request):
    if not _staff_required(request):
        return redirect(reverse("login"))

    if request.method == "GET":
        return render(request, "dashboard/leaders/form.html", {"is_edit": False})

    first_name = request.POST.get("first_name", "").strip()
    last_name  = request.POST.get("last_name", "").strip()
    position   = request.POST.get("position", "").strip()
    details    = request.POST.get("details", "").strip()

    # — contact fields
    phone_1   = request.POST.get("phone_number_1", "").strip()
    phone_2   = request.POST.get("phone_number_2", "").strip()
    email_1   = request.POST.get("email_address_1", "").strip()
    email_2   = request.POST.get("email_address_2", "").strip()
    facebook  = request.POST.get("facebook", "").strip()
    x_twitter = request.POST.get("x_twitter", "").strip()
    youtube   = request.POST.get("youtube", "").strip()
    tiktok    = request.POST.get("tiktok", "").strip()
    instagram = request.POST.get("instagram", "").strip()
    whatsapp  = request.POST.get("whatsapp", "").strip()

    errors = []
    if not first_name:
        errors.append("First name is required.")
    elif not re.match(r"^[A-Za-z\s\-']+$", first_name):
        errors.append("First name must contain letters only.")
    if not last_name:
        errors.append("Last name is required.")
    elif not re.match(r"^[A-Za-z\s\-']+$", last_name):
        errors.append("Last name must contain letters only.")
    if not position:
        errors.append("Position is required.")

    if errors:
        for e in errors:
            messages.error(request, e)
        return redirect(reverse("leader_add"))

    leader = ChurchLeader.objects.create(
        first_name=first_name, last_name=last_name,
        position=position, details=details,
    )
    if "profile_image" in request.FILES:
        leader.profile_image = request.FILES["profile_image"]
        leader.save()

    ChurchLeaderContact.objects.create(
        leader=leader,
        phone_number_1=phone_1, phone_number_2=phone_2,
        email_address_1=email_1, email_address_2=email_2,
        facebook=facebook, x_twitter=x_twitter,
        youtube=youtube, tiktok=tiktok,
        instagram=instagram, whatsapp=whatsapp,
    )

    _log(request, "CREATE", "ChurchLeader", leader.pk, str(leader), f"Added leader: {leader.full_name}")
    messages.success(request, f"Leader '{leader.full_name}' added successfully.")
    return redirect(reverse("leader_detail", args=[leader.pk]))


def leader_detail(request, pk):
    if not _staff_required(request):
        return redirect(reverse("login"))
    leader  = get_object_or_404(ChurchLeader, pk=pk)
    contact = getattr(leader, "contact", None)
    return render(request, "dashboard/leaders/detail.html", {"leader": leader, "contact": contact})


def leader_edit(request, pk):
    if not _staff_required(request):
        return redirect(reverse("login"))
    leader  = get_object_or_404(ChurchLeader, pk=pk)
    contact = getattr(leader, "contact", None)

    if request.method == "GET":
        return render(request, "dashboard/leaders/form.html", {
            "is_edit": True, "leader": leader, "contact": contact,
        })

    first_name = request.POST.get("first_name", "").strip()
    last_name  = request.POST.get("last_name", "").strip()
    position   = request.POST.get("position", "").strip()
    details    = request.POST.get("details", "").strip()

    errors = []
    if not first_name:
        errors.append("First name is required.")
    elif not re.match(r"^[A-Za-z\s\-']+$", first_name):
        errors.append("First name must contain letters only.")
    if not last_name:
        errors.append("Last name is required.")
    elif not re.match(r"^[A-Za-z\s\-']+$", last_name):
        errors.append("Last name must contain letters only.")
    if not position:
        errors.append("Position is required.")

    if errors:
        for e in errors:
            messages.error(request, e)
        return redirect(reverse("leader_edit", args=[pk]))

    leader.first_name = first_name
    leader.last_name  = last_name
    leader.position   = position
    leader.details    = details
    if "profile_image" in request.FILES:
        leader.profile_image = request.FILES["profile_image"]
    leader.save()

    # update or create contact
    contact_data = {
        "phone_number_1":  request.POST.get("phone_number_1", "").strip(),
        "phone_number_2":  request.POST.get("phone_number_2", "").strip(),
        "email_address_1": request.POST.get("email_address_1", "").strip(),
        "email_address_2": request.POST.get("email_address_2", "").strip(),
        "facebook":        request.POST.get("facebook", "").strip(),
        "x_twitter":       request.POST.get("x_twitter", "").strip(),
        "youtube":         request.POST.get("youtube", "").strip(),
        "tiktok":          request.POST.get("tiktok", "").strip(),
        "instagram":       request.POST.get("instagram", "").strip(),
        "whatsapp":        request.POST.get("whatsapp", "").strip(),
    }
    if contact:
        for field, val in contact_data.items():
            setattr(contact, field, val)
        contact.save()
    else:
        ChurchLeaderContact.objects.create(leader=leader, **contact_data)

    _log(request, "UPDATE", "ChurchLeader", leader.pk, str(leader), f"Updated leader: {leader.full_name}")
    messages.success(request, f"Leader '{leader.full_name}' updated successfully.")
    return redirect(reverse("leader_detail", args=[pk]))


def leader_toggle(request, pk):
    if not _staff_required(request):
        return redirect(reverse("login"))
    leader           = get_object_or_404(ChurchLeader, pk=pk)
    leader.is_active = not leader.is_active
    leader.save()
    status = "Activated" if leader.is_active else "Deactivated"
    action = "ACTIVATE" if leader.is_active else "DEACTIVATE"
    _log(request, action, "ChurchLeader", leader.pk, str(leader), f"{status} leader: {leader.full_name}")
    messages.success(request, f"Leader '{leader.full_name}' has been {status.lower()}.")
    return redirect(reverse("leader_detail", args=[pk]))


# ─────────────────────────────────────────────
#  BLOG TAGS
# ─────────────────────────────────────────────

def blog_tags(request):
    if not _staff_required(request):
        return redirect(reverse("login"))

    if request.method == "POST":
        action = request.POST.get("action", "")

        if action == "add":
            title = request.POST.get("title", "").strip()
            if not title:
                messages.error(request, "Tag title is required.")
            elif BlogTag.objects.filter(title__iexact=title).exists():
                messages.error(request, "A tag with this title already exists.")
            else:
                tag = BlogTag.objects.create(title=title)
                _log(request, "CREATE", "BlogTag", tag.pk, str(tag))
                messages.success(request, f"Tag '{tag.title}' created.")
            return redirect(reverse("blog_tags"))

        if action == "delete":
            tag_id = request.POST.get("tag_id")
            tag    = get_object_or_404(BlogTag, pk=tag_id)
            name   = tag.title
            tag.delete()
            _log(request, "DELETE", "BlogTag", tag_id, name)
            messages.success(request, f"Tag '{name}' deleted.")
            return redirect(reverse("blog_tags"))

    tags = BlogTag.objects.annotate(blog_count=Count("blogs")).order_by("title")
    return render(request, "dashboard/blogs/tags.html", {"tags": tags})


# ─────────────────────────────────────────────
#  BLOGS
# ─────────────────────────────────────────────

def blogs_list(request):
    if not _staff_required(request):
        return redirect(reverse("login"))

    q      = request.GET.get("q", "").strip()
    status = request.GET.get("status", "")
    tag_id = request.GET.get("tag", "")

    blogs = Blog.objects.prefetch_related("tags").all()
    if q:
        blogs = blogs.filter(Q(title__icontains=q) | Q(description__icontains=q))
    if status:
        blogs = blogs.filter(status=status)
    if tag_id:
        blogs = blogs.filter(tags__pk=tag_id)

    paginator = Paginator(blogs, 10)
    page_obj  = paginator.get_page(request.GET.get("page", 1))
    all_tags  = BlogTag.objects.all()

    return render(request, "dashboard/blogs/list.html", {
        "page_obj": page_obj, "q": q, "status": status,
        "tag_id": tag_id, "all_tags": all_tags,
    })


def blog_add(request):
    if not _staff_required(request):
        return redirect(reverse("login"))

    all_tags = BlogTag.objects.all()

    if request.method == "GET":
        return render(request, "dashboard/blogs/form.html", {
            "is_edit": False, "all_tags": all_tags,
        })

    title       = request.POST.get("title", "").strip()
    description = request.POST.get("description", "").strip()
    status      = request.POST.get("status", "draft").strip()
    tag_ids     = request.POST.getlist("tags")

    errors = []
    if not title:
        errors.append("Blog title is required.")
    if not description or description == "<p><br></p>":
        errors.append("Blog content is required.")
    if status not in ("draft", "published"):
        errors.append("Invalid status selected.")

    if errors:
        for e in errors:
            messages.error(request, e)
        return redirect(reverse("blog_add"))

    blog = Blog.objects.create(title=title, description=description, status=status)
    if "cover_image" in request.FILES:
        blog.cover_image = request.FILES["cover_image"]
        blog.save()
    if tag_ids:
        blog.tags.set(BlogTag.objects.filter(pk__in=tag_ids))

    _log(request, "CREATE", "Blog", blog.pk, str(blog), f"Added blog: {blog.title}")
    messages.success(request, f"Blog '{blog.title}' created successfully.")
    return redirect(reverse("blog_detail", args=[blog.pk]))


def blog_detail(request, pk):
    if not _staff_required(request):
        return redirect(reverse("login"))
    blog = get_object_or_404(Blog.objects.prefetch_related("tags"), pk=pk)
    return render(request, "dashboard/blogs/detail.html", {"blog": blog})


def blog_edit(request, pk):
    if not _staff_required(request):
        return redirect(reverse("login"))
    blog     = get_object_or_404(Blog, pk=pk)
    all_tags = BlogTag.objects.all()

    if request.method == "GET":
        return render(request, "dashboard/blogs/form.html", {
            "is_edit": True, "blog": blog, "all_tags": all_tags,
            "selected_tags": list(blog.tags.values_list("pk", flat=True)),
        })

    title       = request.POST.get("title", "").strip()
    description = request.POST.get("description", "").strip()
    status      = request.POST.get("status", "draft").strip()
    tag_ids     = request.POST.getlist("tags")

    errors = []
    if not title:
        errors.append("Blog title is required.")
    if not description or description == "<p><br></p>":
        errors.append("Blog content is required.")
    if status not in ("draft", "published"):
        errors.append("Invalid status selected.")

    if errors:
        for e in errors:
            messages.error(request, e)
        return redirect(reverse("blog_edit", args=[pk]))

    if status == "published" and blog.status != "published":
        blog.published_at = timezone.now()

    blog.title       = title
    blog.description = description
    blog.status      = status
    if "cover_image" in request.FILES:
        blog.cover_image = request.FILES["cover_image"]
    blog.save()
    blog.tags.set(BlogTag.objects.filter(pk__in=tag_ids))

    _log(request, "UPDATE", "Blog", blog.pk, str(blog), f"Updated blog: {blog.title}")
    messages.success(request, f"Blog '{blog.title}' updated successfully.")
    return redirect(reverse("blog_detail", args=[pk]))


def blog_toggle_status(request, pk):
    if not _staff_required(request):
        return redirect(reverse("login"))
    blog = get_object_or_404(Blog, pk=pk)
    if blog.status == "published":
        blog.status = "draft"
        action = "DRAFT"
        label  = "set to draft"
    else:
        blog.status      = "published"
        blog.published_at = blog.published_at or timezone.now()
        action = "PUBLISH"
        label  = "published"
    blog.save()
    _log(request, action, "Blog", blog.pk, str(blog))
    messages.success(request, f"Blog '{blog.title}' has been {label}.")
    return redirect(reverse("blog_detail", args=[pk]))


def blog_delete(request, pk):
    if not _staff_required(request):
        return redirect(reverse("login"))
    blog  = get_object_or_404(Blog, pk=pk)
    title = blog.title
    blog.delete()
    _log(request, "DELETE", "Blog", pk, title)
    messages.success(request, f"Blog '{title}' deleted.")
    return redirect(reverse("blogs_list"))


# ─────────────────────────────────────────────
#  EVENTS
# ─────────────────────────────────────────────

def events_list(request):
    if not _staff_required(request):
        return redirect(reverse("login"))

    q      = request.GET.get("q", "").strip()
    status = request.GET.get("status", "")

    events = Event.objects.all()
    if q:
        events = events.filter(Q(title__icontains=q) | Q(location_address__icontains=q))
    if status:
        events = events.filter(status=status)

    paginator = Paginator(events, 10)
    page_obj  = paginator.get_page(request.GET.get("page", 1))

    return render(request, "dashboard/events/list.html", {
        "page_obj": page_obj, "q": q, "status": status,
    })


def event_add(request):
    if not _staff_required(request):
        return redirect(reverse("login"))

    if request.method == "GET":
        return render(request, "dashboard/events/form.html", {"is_edit": False})

    title    = request.POST.get("title", "").strip()
    pub_date = request.POST.get("pub_date", "").strip()
    start    = request.POST.get("start_date", "").strip()
    end      = request.POST.get("end_date", "").strip()
    s_time   = request.POST.get("start_time", "").strip()
    e_time   = request.POST.get("end_time", "").strip()
    location = request.POST.get("location_address", "").strip()
    details  = request.POST.get("details", "").strip()
    status   = request.POST.get("status", "upcoming").strip()

    errors = []
    if not title:
        errors.append("Event title is required.")
    if not pub_date:
        errors.append("Publication date is required.")
    if not start:
        errors.append("Start date is required.")
    if end and end < start:
        errors.append("End date cannot be before start date.")
    if status not in ("upcoming", "active", "finished"):
        errors.append("Invalid status.")

    if errors:
        for e in errors:
            messages.error(request, e)
        return redirect(reverse("event_add"))

    event = Event.objects.create(
        title=title, pub_date=pub_date, start_date=start,
        end_date=end or None, start_time=s_time or None,
        end_time=e_time or None, location_address=location,
        details=details, status=status,
    )
    if "cover_image" in request.FILES:
        event.cover_image = request.FILES["cover_image"]
        event.save()

    _log(request, "CREATE", "Event", event.pk, str(event))
    messages.success(request, f"Event '{event.title}' created successfully.")
    return redirect(reverse("event_detail", args=[event.pk]))


def event_detail(request, pk):
    if not _staff_required(request):
        return redirect(reverse("login"))
    event = get_object_or_404(Event, pk=pk)
    return render(request, "dashboard/events/detail.html", {"event": event})


def event_edit(request, pk):
    if not _staff_required(request):
        return redirect(reverse("login"))
    event = get_object_or_404(Event, pk=pk)

    if request.method == "GET":
        return render(request, "dashboard/events/form.html", {"is_edit": True, "event": event})

    title    = request.POST.get("title", "").strip()
    pub_date = request.POST.get("pub_date", "").strip()
    start    = request.POST.get("start_date", "").strip()
    end      = request.POST.get("end_date", "").strip()
    s_time   = request.POST.get("start_time", "").strip()
    e_time   = request.POST.get("end_time", "").strip()
    location = request.POST.get("location_address", "").strip()
    details  = request.POST.get("details", "").strip()
    status   = request.POST.get("status", "upcoming").strip()

    errors = []
    if not title:
        errors.append("Event title is required.")
    if not pub_date:
        errors.append("Publication date is required.")
    if not start:
        errors.append("Start date is required.")
    if end and end < start:
        errors.append("End date cannot be before start date.")

    if errors:
        for e in errors:
            messages.error(request, e)
        return redirect(reverse("event_edit", args=[pk]))

    event.title            = title
    event.pub_date         = pub_date
    event.start_date       = start
    event.end_date         = end or None
    event.start_time       = s_time or None
    event.end_time         = e_time or None
    event.location_address = location
    event.details          = details
    event.status           = status
    if "cover_image" in request.FILES:
        event.cover_image = request.FILES["cover_image"]
    event.save()

    _log(request, "UPDATE", "Event", event.pk, str(event))
    messages.success(request, f"Event '{event.title}' updated.")
    return redirect(reverse("event_detail", args=[pk]))


def event_set_status(request, pk):
    if not _staff_required(request):
        return redirect(reverse("login"))
    event  = get_object_or_404(Event, pk=pk)
    status = request.POST.get("status", "").strip()
    if status in ("upcoming", "active", "finished"):
        event.status = status
        event.save()
        _log(request, "UPDATE", "Event", event.pk, str(event), f"Status → {status}")
        messages.success(request, f"Event status updated to '{status}'.")
    return redirect(reverse("event_detail", args=[pk]))


def event_delete(request, pk):
    if not _staff_required(request):
        return redirect(reverse("login"))
    event = get_object_or_404(Event, pk=pk)
    title = event.title
    event.delete()
    _log(request, "DELETE", "Event", pk, title)
    messages.success(request, f"Event '{title}' deleted.")
    return redirect(reverse("events_list"))


# ─────────────────────────────────────────────
#  SERVICES / PRAYERS
# ─────────────────────────────────────────────

def services_list(request):
    if not _staff_required(request):
        return redirect(reverse("login"))
    q        = request.GET.get("q", "").strip()
    services = Service.objects.all()
    if q:
        services = services.filter(title__icontains=q)
    paginator = Paginator(services, 10)
    page_obj  = paginator.get_page(request.GET.get("page", 1))
    return render(request, "dashboard/services/list.html", {"page_obj": page_obj, "q": q})


def service_add(request):
    if not _staff_required(request):
        return redirect(reverse("login"))

    if request.method == "GET":
        return render(request, "dashboard/services/form.html", {
            "is_edit": False, "day_choices": Service.DayOfWeek.choices,
        })

    title          = request.POST.get("title", "").strip()
    start_time     = request.POST.get("start_time", "").strip()
    end_time       = request.POST.get("end_time", "").strip()
    details        = request.POST.get("details", "").strip()
    is_single_day  = request.POST.get("is_single_day") == "on"
    runs_every_day = request.POST.get("runs_every_day") == "on"
    start_day      = request.POST.get("start_day", "").strip()
    end_day        = request.POST.get("end_day", "").strip()
    day_of_week    = request.POST.get("day_of_week", "").strip()

    errors = []
    if not title:
        errors.append("Service title is required.")
    if not start_time:
        errors.append("Start time is required.")

    if errors:
        for e in errors:
            messages.error(request, e)
        return redirect(reverse("service_add"))

    service = Service.objects.create(
        title=title,
        start_time=start_time,
        end_time=end_time or None,
        details=details,
        is_single_day=is_single_day,
        runs_every_day=runs_every_day,
        start_day=start_day or None,
        end_day=end_day or None,
        day_of_week=int(day_of_week) if day_of_week != "" else None,
    )

    _log(request, "CREATE", "Service", service.pk, str(service))
    messages.success(request, f"Service '{service.title}' added.")
    return redirect(reverse("service_detail", args=[service.pk]))


def service_detail(request, pk):
    if not _staff_required(request):
        return redirect(reverse("login"))
    service = get_object_or_404(Service, pk=pk)
    return render(request, "dashboard/services/detail.html", {"service": service})


def service_edit(request, pk):
    if not _staff_required(request):
        return redirect(reverse("login"))
    service = get_object_or_404(Service, pk=pk)

    if request.method == "GET":
        return render(request, "dashboard/services/form.html", {
            "is_edit": True, "service": service, "day_choices": Service.DayOfWeek.choices,
        })

    title          = request.POST.get("title", "").strip()
    start_time     = request.POST.get("start_time", "").strip()
    end_time       = request.POST.get("end_time", "").strip()
    details        = request.POST.get("details", "").strip()
    is_single_day  = request.POST.get("is_single_day") == "on"
    runs_every_day = request.POST.get("runs_every_day") == "on"
    start_day      = request.POST.get("start_day", "").strip()
    end_day        = request.POST.get("end_day", "").strip()
    day_of_week    = request.POST.get("day_of_week", "").strip()

    if not title:
        messages.error(request, "Service title is required.")
        return redirect(reverse("service_edit", args=[pk]))
    if not start_time:
        messages.error(request, "Start time is required.")
        return redirect(reverse("service_edit", args=[pk]))

    service.title          = title
    service.start_time     = start_time
    service.end_time       = end_time or None
    service.details        = details
    service.is_single_day  = is_single_day
    service.runs_every_day = runs_every_day
    service.start_day      = start_day or None
    service.end_day        = end_day or None
    service.day_of_week    = int(day_of_week) if day_of_week != "" else None
    service.save()

    _log(request, "UPDATE", "Service", service.pk, str(service))
    messages.success(request, f"Service '{service.title}' updated.")
    return redirect(reverse("service_detail", args=[pk]))


def service_delete(request, pk):
    if not _staff_required(request):
        return redirect(reverse("login"))
    service = get_object_or_404(Service, pk=pk)
    title   = service.title
    service.delete()
    _log(request, "DELETE", "Service", pk, title)
    messages.success(request, f"Service '{title}' deleted.")
    return redirect(reverse("services_list"))


# ─────────────────────────────────────────────
#  MINISTRY WORK
# ─────────────────────────────────────────────

def ministry_list(request):
    if not _staff_required(request):
        return redirect(reverse("login"))

    q        = request.GET.get("q", "").strip()
    wtype    = request.GET.get("type", "")
    ministry = MinistryWork.objects.all()
    if q:
        ministry = ministry.filter(title__icontains=q)
    if wtype:
        ministry = ministry.filter(type=wtype)

    paginator = Paginator(ministry, 10)
    page_obj  = paginator.get_page(request.GET.get("page", 1))

    return render(request, "dashboard/ministry/list.html", {
        "page_obj": page_obj, "q": q, "wtype": wtype,
        "type_choices": MinistryWork.WorkType.choices,
    })


def ministry_add(request):
    if not _staff_required(request):
        return redirect(reverse("login"))

    if request.method == "GET":
        return render(request, "dashboard/ministry/form.html", {
            "is_edit": False, "type_choices": MinistryWork.WorkType.choices,
        })

    title   = request.POST.get("title", "").strip()
    date    = request.POST.get("date", "").strip()
    time    = request.POST.get("time", "").strip()
    wtype   = request.POST.get("type", "other").strip()
    details = request.POST.get("details", "").strip()

    errors = []
    if not title:
        errors.append("Title is required.")
    if not date:
        errors.append("Date is required.")
    if wtype not in [c[0] for c in MinistryWork.WorkType.choices]:
        errors.append("Invalid type selected.")

    if errors:
        for e in errors:
            messages.error(request, e)
        return redirect(reverse("ministry_add"))

    work = MinistryWork.objects.create(
        title=title, date=date, time=time or None, type=wtype, details=details,
    )
    _log(request, "CREATE", "MinistryWork", work.pk, str(work))
    messages.success(request, f"Ministry work '{work.title}' added.")
    return redirect(reverse("ministry_detail", args=[work.pk]))


def ministry_detail(request, pk):
    if not _staff_required(request):
        return redirect(reverse("login"))
    work    = get_object_or_404(MinistryWork, pk=pk)
    gallery = work.gallery_images.all()
    return render(request, "dashboard/ministry/detail.html", {"work": work, "gallery": gallery})


def ministry_edit(request, pk):
    if not _staff_required(request):
        return redirect(reverse("login"))
    work = get_object_or_404(MinistryWork, pk=pk)

    if request.method == "GET":
        return render(request, "dashboard/ministry/form.html", {
            "is_edit": True, "work": work, "type_choices": MinistryWork.WorkType.choices,
        })

    title   = request.POST.get("title", "").strip()
    date    = request.POST.get("date", "").strip()
    time    = request.POST.get("time", "").strip()
    wtype   = request.POST.get("type", "other").strip()
    details = request.POST.get("details", "").strip()

    if not title:
        messages.error(request, "Title is required.")
        return redirect(reverse("ministry_edit", args=[pk]))
    if not date:
        messages.error(request, "Date is required.")
        return redirect(reverse("ministry_edit", args=[pk]))

    work.title   = title
    work.date    = date
    work.time    = time or None
    work.type    = wtype
    work.details = details
    work.save()

    _log(request, "UPDATE", "MinistryWork", work.pk, str(work))
    messages.success(request, f"Ministry work '{work.title}' updated.")
    return redirect(reverse("ministry_detail", args=[pk]))


def ministry_delete(request, pk):
    if not _staff_required(request):
        return redirect(reverse("login"))
    work  = get_object_or_404(MinistryWork, pk=pk)
    title = work.title
    work.delete()
    _log(request, "DELETE", "MinistryWork", pk, title)
    messages.success(request, f"Ministry work '{title}' deleted.")
    return redirect(reverse("ministry_list"))


# ─────────────────────────────────────────────
#  GALLERY
# ─────────────────────────────────────────────

def gallery_list(request):
    if not _staff_required(request):
        return redirect(reverse("login"))

    ministry_id = request.GET.get("ministry", "")
    images      = GalleryImage.objects.select_related("ministry_work").all()
    if ministry_id:
        images = images.filter(ministry_work__pk=ministry_id)

    paginator  = Paginator(images, 16)
    page_obj   = paginator.get_page(request.GET.get("page", 1))
    ministries = MinistryWork.objects.all()

    return render(request, "dashboard/gallery/list.html", {
        "page_obj": page_obj, "ministries": ministries, "ministry_id": ministry_id,
    })


def gallery_add(request):
    if not _staff_required(request):
        return redirect(reverse("login"))

    if request.method == "GET":
        ministries = MinistryWork.objects.all()
        return render(request, "dashboard/gallery/add.html", {"ministries": ministries})

    ministry_id = request.POST.get("ministry_work", "").strip()
    caption     = request.POST.get("caption", "").strip()

    if "image" not in request.FILES:
        messages.error(request, "Please select an image to upload.")
        return redirect(reverse("gallery_add"))

    ministry = None
    if ministry_id:
        ministry = get_object_or_404(MinistryWork, pk=ministry_id)

    img = GalleryImage.objects.create(
        image=request.FILES["image"],
        caption=caption,
        ministry_work=ministry,
    )
    _log(request, "CREATE", "GalleryImage", img.pk, str(img))
    messages.success(request, "Image uploaded successfully.")
    return redirect(reverse("gallery_list"))


def gallery_delete(request, pk):
    if not _staff_required(request):
        return redirect(reverse("login"))
    img = get_object_or_404(GalleryImage, pk=pk)
    _log(request, "DELETE", "GalleryImage", pk, str(img))
    img.delete()
    messages.success(request, "Image deleted.")
    return redirect(reverse("gallery_list"))


# ─────────────────────────────────────────────
#  TESTIMONIALS
# ─────────────────────────────────────────────

def testimonials_list(request):
    if not _staff_required(request):
        return redirect(reverse("login"))

    q        = request.GET.get("q", "").strip()
    approved = request.GET.get("approved", "")
    items    = Testimony.objects.all()

    if q:
        items = items.filter(Q(name__icontains=q) | Q(message__icontains=q))
    if approved == "1":
        items = items.filter(is_approved=True)
    elif approved == "0":
        items = items.filter(is_approved=False)

    paginator = Paginator(items, 10)
    page_obj  = paginator.get_page(request.GET.get("page", 1))

    return render(request, "dashboard/testimonials/list.html", {
        "page_obj": page_obj, "q": q, "approved": approved,
    })


def testimony_add(request):
    if not _staff_required(request):
        return redirect(reverse("login"))

    if request.method == "GET":
        return render(request, "dashboard/testimonials/form.html", {"is_edit": False})

    name    = request.POST.get("name", "").strip()
    message = request.POST.get("message", "").strip()
    date    = request.POST.get("date", "").strip()
    time    = request.POST.get("time", "").strip()
    approve = request.POST.get("is_approved") == "on"

    errors = []
    if not name:
        errors.append("Name is required.")
    if not message or message == "<p><br></p>":
        errors.append("Testimony message is required.")
    if not date:
        errors.append("Date is required.")

    if errors:
        for e in errors:
            messages.error(request, e)
        return redirect(reverse("testimony_add"))

    t = Testimony.objects.create(
        name=name, message=message, date=date,
        time=time or None, is_approved=approve,
    )
    if "picture" in request.FILES:
        t.picture = request.FILES["picture"]
        t.save()

    _log(request, "CREATE", "Testimony", t.pk, str(t))
    messages.success(request, f"Testimony by '{name}' added.")
    return redirect(reverse("testimony_detail", args=[t.pk]))


def testimony_detail(request, pk):
    if not _staff_required(request):
        return redirect(reverse("login"))
    t = get_object_or_404(Testimony, pk=pk)
    return render(request, "dashboard/testimonials/detail.html", {"testimony": t})


def testimony_edit(request, pk):
    if not _staff_required(request):
        return redirect(reverse("login"))
    t = get_object_or_404(Testimony, pk=pk)

    if request.method == "GET":
        return render(request, "dashboard/testimonials/form.html", {"is_edit": True, "testimony": t})

    name    = request.POST.get("name", "").strip()
    message = request.POST.get("message", "").strip()
    date    = request.POST.get("date", "").strip()
    time    = request.POST.get("time", "").strip()
    approve = request.POST.get("is_approved") == "on"

    if not name:
        messages.error(request, "Name is required.")
        return redirect(reverse("testimony_edit", args=[pk]))
    if not message or message == "<p><br></p>":
        messages.error(request, "Message is required.")
        return redirect(reverse("testimony_edit", args=[pk]))

    t.name        = name
    t.message     = message
    t.date        = date
    t.time        = time or None
    t.is_approved = approve
    if "picture" in request.FILES:
        t.picture = request.FILES["picture"]
    t.save()

    _log(request, "UPDATE", "Testimony", t.pk, str(t))
    messages.success(request, "Testimony updated.")
    return redirect(reverse("testimony_detail", args=[pk]))


def testimony_toggle_approval(request, pk):
    if not _staff_required(request):
        return redirect(reverse("login"))
    t             = get_object_or_404(Testimony, pk=pk)
    t.is_approved = not t.is_approved
    t.save()
    action = "APPROVE" if t.is_approved else "REVOKE"
    label  = "approved" if t.is_approved else "revoked"
    _log(request, action, "Testimony", t.pk, str(t))
    messages.success(request, f"Testimony by '{t.name}' {label}.")
    return redirect(reverse("testimony_detail", args=[pk]))


def testimony_delete(request, pk):
    if not _staff_required(request):
        return redirect(reverse("login"))
    t    = get_object_or_404(Testimony, pk=pk)
    name = t.name
    t.delete()
    _log(request, "DELETE", "Testimony", pk, f"Testimony by {name}")
    messages.success(request, f"Testimony by '{name}' deleted.")
    return redirect(reverse("testimonials_list"))


# ─────────────────────────────────────────────
#  STAFF / USER MANAGEMENT
# ─────────────────────────────────────────────

def staff_list(request):
    if not _staff_required(request):
        return redirect(reverse("login"))

    q        = request.GET.get("q", "").strip()
    role     = request.GET.get("role", "")
    status   = request.GET.get("status", "")
    users    = CustomUser.objects.all().order_by("-date_joined")

    if q:
        users = users.filter(
            Q(username__icontains=q) | Q(email__icontains=q) |
            Q(first_name__icontains=q) | Q(last_name__icontains=q)
        )
    if role == "staff":
        users = users.filter(is_staff=True)
    elif role == "user":
        users = users.filter(is_staff=False)
    if status == "active":
        users = users.filter(is_active=True)
    elif status == "inactive":
        users = users.filter(is_active=False)

    paginator = Paginator(users, 15)
    page_obj  = paginator.get_page(request.GET.get("page", 1))

    return render(request, "dashboard/staff/list.html", {
        "page_obj": page_obj, "q": q, "role": role, "status": status,
    })


def staff_confirm(request, pk):
    if not _staff_required(request):
        return redirect(reverse("login"))
    user = get_object_or_404(CustomUser, pk=pk)
    return render(request, "dashboard/staff/confirm.html", {"target_user": user})


def staff_detail(request, pk):
    if not _staff_required(request):
        return redirect(reverse("login"))
    target_user = get_object_or_404(CustomUser, pk=pk)
    logs        = ActivityLog.objects.filter(
        Q(user=target_user) | Q(object_id=target_user.pk, model_name="CustomUser")
    ).order_by("-created_at")[:20]
    return render(request, "dashboard/staff/detail.html", {
        "target_user": target_user, "logs": logs,
    })


def staff_activate(request, pk):
    if not _staff_required(request):
        return redirect(reverse("login"))
    user           = get_object_or_404(CustomUser, pk=pk)
    user.is_active = True
    user.save()
    _log(request, "ACTIVATE", "CustomUser", user.pk, str(user), f"Activated user: {user.username}")
    messages.success(request, f"Account '{user.username}' activated.")
    return redirect(reverse("staff_detail", args=[pk]))


def staff_deactivate(request, pk):
    if not _staff_required(request):
        return redirect(reverse("login"))
    if request.user.pk == pk:
        messages.error(request, "You cannot deactivate your own account.")
        return redirect(reverse("staff_detail", args=[pk]))
    user           = get_object_or_404(CustomUser, pk=pk)
    user.is_active = False
    user.save()
    _log(request, "DEACTIVATE", "CustomUser", user.pk, str(user), f"Deactivated user: {user.username}")
    messages.success(request, f"Account '{user.username}' deactivated.")
    return redirect(reverse("staff_detail", args=[pk]))


def staff_grant(request, pk):
    if not _staff_required(request):
        return redirect(reverse("login"))
    user          = get_object_or_404(CustomUser, pk=pk)
    user.is_staff = True
    user.save()
    _log(request, "STAFF_ADD", "CustomUser", user.pk, str(user), f"Granted staff: {user.username}")
    messages.success(request, f"'{user.username}' has been granted staff access.")
    return redirect(reverse("staff_detail", args=[pk]))


def staff_revoke(request, pk):
    if not _staff_required(request):
        return redirect(reverse("login"))
    if request.user.pk == pk:
        messages.error(request, "You cannot revoke your own staff access.")
        return redirect(reverse("staff_detail", args=[pk]))
    user          = get_object_or_404(CustomUser, pk=pk)
    user.is_staff = False
    user.save()
    _log(request, "STAFF_REM", "CustomUser", user.pk, str(user), f"Revoked staff: {user.username}")
    messages.success(request, f"Staff access revoked for '{user.username}'.")
    return redirect(reverse("staff_detail", args=[pk]))


# ─────────────────────────────────────────────
#  ACTIVITY LOGS
# ─────────────────────────────────────────────

def activity_logs(request):
    if not _staff_required(request):
        return redirect(reverse("login"))

    q      = request.GET.get("q", "").strip()
    action = request.GET.get("action", "")
    model  = request.GET.get("model", "")

    logs = ActivityLog.objects.select_related("user").all()
    if q:
        logs = logs.filter(
            Q(object_repr__icontains=q) | Q(description__icontains=q) |
            Q(user__username__icontains=q)
        )
    if action:
        logs = logs.filter(action=action)
    if model:
        logs = logs.filter(model_name=model)

    paginator = Paginator(logs, 20)
    page_obj  = paginator.get_page(request.GET.get("page", 1))

    action_choices = ActivityLog.ACTION_CHOICES
    model_names    = ActivityLog.objects.values_list("model_name", flat=True).distinct().order_by("model_name")

    return render(request, "dashboard/logs/list.html", {
        "page_obj":      page_obj,
        "q":             q,
        "action":        action,
        "model":         model,
        "action_choices": action_choices,
        "model_names":   model_names,
    })