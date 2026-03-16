# context_processors.py
from gcci_backend.conf import current_date, current_yr

def site_settings(request):
    """
    Adds site-wide settings to all templates.
    """
    return {
        'site_name_full': 'Gospel City Church International',
        'site_name_short': 'gcci',
        'current_year':current_yr(),
        "current_date":current_date(),
    }