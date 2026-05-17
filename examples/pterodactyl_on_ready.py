# discord.py — à coller dans ton bot sur Pterodactyl (serveur Python)
# pip install aiohttp
#
# Variable Pterodactyl (serveur bot) :
#   STATS_API_URL = http://IP:PORT   ← allocation du serveur Node.js

import os
import aiohttp

STATS_API_URL = os.getenv("STATS_API_URL", "http://127.0.0.1:3000").rstrip("/")


async def envoyer_stats_site(bot):
    serveurs = len(bot.guilds)
    utilisateurs = sum((g.member_count or 0) for g in bot.guilds)
    url = f"{STATS_API_URL}/api/stats/sync"

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                url,
                json={"guilds": serveurs, "users": utilisateurs},
                timeout=aiohttp.ClientTimeout(total=15),
            ) as resp:
                text = await resp.text()
                if resp.status >= 400:
                    print(f"[Site] Erreur {resp.status} : {text}")
                else:
                    print(f"[Site] OK — {serveurs} serveurs, {utilisateurs} utilisateurs")
    except aiohttp.ClientConnectorError:
        print("[Site] Site injoignable (bot Python ne voit pas le serveur Node).")
        print(f"  URL : {url}")
        print("  Ptero → variable STATS_API_URL=http://IP:PORT du serveur Node")
    except Exception as e:
        print(f"[Site] Erreur : {e}")


# Dans ton main.py :
#
# @bot.event
# async def on_ready():
#     print(f"Connecté : {bot.user}")
#     await envoyer_stats_site(bot)
