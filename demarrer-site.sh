#!/bin/bash
# Sur le VPS (même machine que le bot) :
#   chmod +x demarrer-site.sh
#   ./demarrer-site.sh
# Ou en arrière-plan : nohup ./demarrer-site.sh &

cd "$(dirname "$0")"
echo ""
echo "  Site : http://127.0.0.1:3000"
echo "  Le bot Python doit tourner sur CE même VPS."
echo ""

if ! command -v node &>/dev/null; then
  echo "  Node.js manquant. Installe : apt install nodejs  ou  nvm install 18"
  exit 1
fi

node server.js
