# Dockerfile pour le serveur WebSocket GoalCraft
FROM node:20-alpine

WORKDIR /app

# Créer le fichier du serveur WebSocket
COPY websocket-server.js ./

# Installer les dépendances nécessaires
RUN npm init -y && \
    npm install ws mongodb dotenv

# Exposer le port WebSocket
EXPOSE 3002

# Démarrer le serveur
CMD ["node", "websocket-server.js"]