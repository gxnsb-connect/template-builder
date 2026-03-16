from django.urls import path, include
from . import views
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    # path('', views.dashboard_home, name='dashboard_home'),
    path('auth/', include("authentication.urls")),


    # ── Dashboard Overview ──────────────────────────────────────────────────
    path("",                             views.dashboard,              name="dashboard"),

    # ── Church Leaders ──────────────────────────────────────────────────────
    path("leaders/",                     views.leaders_list,           name="leaders_list"),
    path("leaders/add/",                 views.leader_add,             name="leader_add"),
    path("leaders/<int:pk>/",            views.leader_detail,          name="leader_detail"),
    path("leaders/<int:pk>/edit/",       views.leader_edit,            name="leader_edit"),
    path("leaders/<int:pk>/toggle/",     views.leader_toggle,          name="leader_toggle"),

    # ── Blog Tags ───────────────────────────────────────────────────────────
    path("blogs/tags/",                  views.blog_tags,              name="blog_tags"),

    # ── Blogs ───────────────────────────────────────────────────────────────
    path("blogs/",                       views.blogs_list,             name="blogs_list"),
    path("blogs/add/",                   views.blog_add,               name="blog_add"),
    path("blogs/<int:pk>/",              views.blog_detail,            name="blog_detail"),
    path("blogs/<int:pk>/edit/",         views.blog_edit,              name="blog_edit"),
    path("blogs/<int:pk>/toggle/",       views.blog_toggle_status,     name="blog_toggle_status"),
    path("blogs/<int:pk>/delete/",       views.blog_delete,            name="blog_delete"),

    # ── Events ──────────────────────────────────────────────────────────────
    path("events/",                      views.events_list,            name="events_list"),
    path("events/add/",                  views.event_add,              name="event_add"),
    path("events/<int:pk>/",             views.event_detail,           name="event_detail"),
    path("events/<int:pk>/edit/",        views.event_edit,             name="event_edit"),
    path("events/<int:pk>/set-status/",  views.event_set_status,       name="event_set_status"),
    path("events/<int:pk>/delete/",      views.event_delete,           name="event_delete"),

    # ── Services / Prayers ──────────────────────────────────────────────────
    path("services/",                    views.services_list,          name="services_list"),
    path("services/add/",                views.service_add,            name="service_add"),
    path("services/<int:pk>/",           views.service_detail,         name="service_detail"),
    path("services/<int:pk>/edit/",      views.service_edit,           name="service_edit"),
    path("services/<int:pk>/delete/",    views.service_delete,         name="service_delete"),

    # ── Ministry Work ───────────────────────────────────────────────────────
    path("ministry/",                    views.ministry_list,          name="ministry_list"),
    path("ministry/add/",                views.ministry_add,           name="ministry_add"),
    path("ministry/<int:pk>/",           views.ministry_detail,        name="ministry_detail"),
    path("ministry/<int:pk>/edit/",      views.ministry_edit,          name="ministry_edit"),
    path("ministry/<int:pk>/delete/",    views.ministry_delete,        name="ministry_delete"),

    # ── Gallery ─────────────────────────────────────────────────────────────
    path("gallery/",                     views.gallery_list,           name="gallery_list"),
    path("gallery/add/",                 views.gallery_add,            name="gallery_add"),
    path("gallery/<int:pk>/delete/",     views.gallery_delete,         name="gallery_delete"),

    # ── Testimonials ────────────────────────────────────────────────────────
    path("testimonials/",                views.testimonials_list,      name="testimonials_list"),
    path("testimonials/add/",            views.testimony_add,          name="testimony_add"),
    path("testimonials/<int:pk>/",       views.testimony_detail,       name="testimony_detail"),
    path("testimonials/<int:pk>/edit/",  views.testimony_edit,         name="testimony_edit"),
    path("testimonials/<int:pk>/toggle/",views.testimony_toggle_approval, name="testimony_toggle_approval"),
    path("testimonials/<int:pk>/delete/",views.testimony_delete,       name="testimony_delete"),

    # ── Staff / Users ───────────────────────────────────────────────────────
    path("staff/",                       views.staff_list,             name="staff_list"),
    path("staff/<int:pk>/",              views.staff_detail,           name="staff_detail"),
    path("staff/<int:pk>/confirm/",      views.staff_confirm,          name="staff_confirm"),
    path("staff/<int:pk>/activate/",     views.staff_activate,         name="staff_activate"),
    path("staff/<int:pk>/deactivate/",   views.staff_deactivate,       name="staff_deactivate"),
    path("staff/<int:pk>/grant/",        views.staff_grant,            name="staff_grant"),
    path("staff/<int:pk>/revoke/",       views.staff_revoke,           name="staff_revoke"),

    # ── Activity Logs ────────────────────────────────────────────────────────
    path("logs/",                        views.activity_logs,          name="activity_logs"),
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)