from django.shortcuts import render, redirect, HttpResponse
from django.conf import settings
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
import json


# ── SVG library helper ──

def read_svg_json_lib():
    with open(settings.SVG_LIBRARY_DIR / "svg_data.json", encoding="utf-8") as f:
        data = list(json.load(f))
    return data


@login_required(login_url='login')
def tb(request):
    context = {
        "svgs": read_svg_json_lib()
    }
    return render(request, "tb/builder.html", context)


# ── AUTH ──

def register_view(request):
    if request.user.is_authenticated:
        return redirect('tb')

    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        email = request.POST.get("email", "").strip()
        password1 = request.POST.get("password1", "")
        password2 = request.POST.get("password2", "")

        if not username or not email or not password1 or not password2:
            messages.error(request, "All fields are required.")
        elif password1 != password2:
            messages.error(request, "Passwords do not match.")
        elif len(password1) < 8:
            messages.error(request, "Password must be at least 8 characters long.")
        elif User.objects.filter(username=username).exists():
            messages.error(request, "That username is already taken.")
        elif User.objects.filter(email=email).exists():
            messages.error(request, "An account with that email already exists.")
        else:
            user = User.objects.create_user(username=username, email=email, password=password1)
            login(request, user)
            messages.success(request, "Account created. Welcome!")
            return redirect('tb')

        return render(request, "accounts/register.html", {
            "old_username": username,
            "old_email": email,
        })

    return render(request, "accounts/register.html")


def login_view(request):
    if request.user.is_authenticated:
        return redirect('tb')

    next_url = request.GET.get("next", "") or request.POST.get("next", "")

    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        password = request.POST.get("password", "")

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect(next_url or 'tb')

        messages.error(request, "Invalid username or password.")
        return render(request, "accounts/login.html", {
            "old_username": username,
            "next": next_url,
        })

    return render(request, "accounts/login.html", {"next": next_url})


@login_required(login_url='login')
def logout_view(request):
    logout(request)
    messages.success(request, "You've been logged out.")
    return redirect('login')