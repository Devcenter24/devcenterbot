"""
Lance ce script SUR LE VPS (même endroit que le bot) pour tester si le site répond.
  python test_site.py
"""

import os
import sys

URL = os.getenv("STATS_API_URL", "http://127.0.0.1:3000").rstrip("/")

def main():
    try:
        import urllib.request
        import json

        print(f"Test GET {URL}/api/stats ...")
        with urllib.request.urlopen(f"{URL}/api/stats", timeout=5) as r:
            data = json.loads(r.read().decode())
            print("OK — API accessible")
            print(f"  Serveurs : {data.get('live', {}).get('guilds')}")
            print(f"  Utilisateurs : {data.get('live', {}).get('users')}")
            return 0
    except Exception as e:
        print("ÉCHEC — le site ne tourne pas sur cette machine.")
        print(f"  Erreur : {e}")
        print()
        print("  → Copie le dossier 'bot Devcenter' sur le VPS")
        print("  → Lance : node server.js   ou   ./demarrer-site.sh")
        print("  → Puis redémarre le bot")
        return 1

if __name__ == "__main__":
    sys.exit(main())
