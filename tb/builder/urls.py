from django.urls import path
from builder import views

urlpatterns = [
    path("", views.tb, name='tb'),
    path("register/", views.register_view, name='register'),
    path("login/", views.login_view, name='login'),
    path("logout/", views.logout_view, name='logout'),
    # path("rr", views.read_svg_json_lib, name="rr")
]