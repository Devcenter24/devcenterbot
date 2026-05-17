"""
DevCenterBot — sync stats (discord.py / Python).

    from bot_sync import start_auto_sync
    start_auto_sync(bot)

Pterodactyl (2 serveurs : bot Python + site Node) :
    Variable sur le serveur PYTHON :
    STATS_API_URL=http://IP:PORT   ← allocation du serveur Node

Même conteneur (node server.js & python main.py) :
    STATS_API_URL=http://127.0.0.1:3000
"""

import os
import json
import asyncio

STATS_API_URL = os.getenv("STATS_API_URL", "http://127.0.0.1:3000").rstrip("/")


def get_stats(bot):
    return {
        "guilds": len(bot.guilds),
        "users": sum((g.member_count or 0) for g in bot.guilds),
    }


async def sync_stats(bot):
    """Envoie serveurs + utilisateurs au site."""
    import aiohttp

    payload = get_stats(bot)
    url = f"{STATS_API_URL}/api/stats/sync"

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                text = await resp.text()
                if resp.status >= 400:
                    print(f"[Site] Erreur {resp.status}: {text}")
                    return False
                print(f"[Site] OK — {payload['guilds']} serveurs, {payload['users']} utilisateurs")
                return True
    except aiohttp.ClientConnectorError:
        print("[Site] Site injoignable à cette adresse.")
        print(f"  URL : {url}")
        print("  Pterodactyl : crée un serveur Node.js séparé, puis mets dans le bot :")
        print("    STATS_API_URL=http://IP:PORT   (allocation du serveur Node)")
        print("  Voir le fichier PTERODACTYL.txt dans le dossier du site.")
        return False
    except Exception as e:
        print(f"[Site] Erreur : {e}")
        return False


async def _sync_loop(bot, interval):
    await bot.wait_until_ready()
    while not bot.is_closed():
        await sync_stats(bot)
        await asyncio.sleep(interval)


def start_auto_sync(bot, interval_seconds=300):
    """Sync au démarrage puis toutes les 5 minutes."""

    @bot.listen("on_ready")
    async def _on_ready_sync():
        await sync_stats(bot)
        bot.loop.create_task(_sync_loop(bot, interval_seconds))
