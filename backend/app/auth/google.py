"""Google Sign-In: verify the ID token the browser gets from Google Identity Services.

`verify_oauth2_token` checks the token's signature (against Google's published certs,
fetched and cached by the transport), its expiry, its issuer, and — because we pass the
client id as the audience — that it was minted for *our* app. It raises ValueError on any
failure; the caller turns that into a 401.
"""

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token


def verify_google_token(credential: str, client_id: str) -> dict:
    return id_token.verify_oauth2_token(credential, google_requests.Request(), client_id)
