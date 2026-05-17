@echo off
cd /d "%~dp0"
echo.
echo  Ouvre dans le navigateur : http://127.0.0.1:3000
echo  (ne pas ouvrir index.html en double-clic)
echo.
echo  Le bot Python doit envoyer les stats vers cette adresse.
echo  Laisse cette fenetre ouverte.
echo.
node server.js
pause
