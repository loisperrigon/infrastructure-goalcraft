# 🚀 Infrastructure GoalCraftAI + n8n

<p align="center">
  <strong>Infrastructure complète pour GoalCraftAI avec n8n et MongoDB</strong><br>
  Next.js App Router • WebSocket Intégré • n8n Workflows • MongoDB • SSL Auto
</p>

<p align="center">
  <a href="#-démarrage-rapide">Démarrage Rapide</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-services">Services</a> •
  <a href="#-déploiement">Déploiement</a>
</p>

---

> 🎯 **Objectif** : Infrastructure complète pour déployer GoalCraftAI avec workflow automation n8n, WebSocket intégré et MongoDB.

## ✨ Services Configurés

✅ **Stack technique complète**

- 🎮 **GoalCraftAI** : Application Next.js 15 avec gamification d'objectifs
- 🤖 **n8n Workflows** : Automatisation et génération IA
- 💬 **WebSocket Intégré** : Temps réel sur port 3002 (lancé avec Next.js)
- 🗄️ **MongoDB** : Base de données pour persistance
- 🔒 **Nginx + SSL** : Reverse proxy avec certificats auto

## 🏗️ Architecture

### Diagramme des services

```
┌─────────────────────────────────────────────────────────────┐
│                         NGINX (SSL)                          │
│  ┌──────────────────┐  ┌─────────────────────┐             │
│  │ questpulse.store │  │ n8n.questpulse.store│             │
│  │    (avec /ws)    │  └──────────┬──────────┘             │
│  └────────┬─────────┘             │                         │
└───────────┼───────────────────────┼─────────────────────────┘
            │                       │
    ┌───────▼────────┐      ┌──────▼──────┐
    │  GoalCraft App │      │     n8n     │
    │   Port 3000    │      │  Port 5678  │
    │       +        │      └──────┬──────┘
    │   WebSocket    │             │
    │   Port 3002    │             │
    └───────┬────────┘             │
            │                      │
    ┌───────▼──────────────────────▼──────┐
    │       MongoDB (Port 27017)          │
    └──────────────────────────────────────┘
```

### Structure des fichiers

```
infrastructure-goalcraft/
├── services/
│   └── goalcraft/              # Code source GoalCraftAI (submodule ou clone)
│       ├── frontend/
│       │   ├── Dockerfile      # Build Next.js + WebSocket intégré
│       │   ├── websocket-server.js # Serveur WebSocket
│       │   └── ...             # Code Next.js App Router
│       └── docker-compose.yml  # Config Docker originale
├── nginx/
│   └── sites-available/
│       ├── n8n.conf           # Config nginx pour n8n.questpulse.store
│       └── goalcraft.conf     # Config nginx pour questpulse.store (avec /ws)
├── scripts/
│   ├── deploy-nginx.sh        # Déploiement nginx avec backup
│   └── backup-docker-volumes.sh # Backup des volumes
├── docker-compose.yml         # Orchestration principale
├── .env.example              # Template variables d'environnement
└── README.md                 # Ce fichier
```

## 🚀 Démarrage Rapide

### 1. Cloner le repository

```bash
# Cloner le repo privé
git clone https://github.com/loisperrigon/infrastructure-goalcraft.git
cd infrastructure-goalcraft

# Le code GoalCraftAI est déjà inclus dans services/goalcraft/
```

### 2. Configuration de l'environnement

```bash
# Copier et configurer les variables
cp .env.example .env
nano .env
```

**Variables importantes à configurer :**

```env
# n8n - Workflow automation
N8N_HOST=n8n.questpulse.store
N8N_PASSWORD=votre-mot-de-passe-fort

# MongoDB pour GoalCraft
MONGO_PASSWORD=mot-de-passe-mongodb

# NextAuth (authentification GoalCraft)
NEXTAUTH_URL=https://questpulse.store
NEXTAUTH_SECRET=chaine-aleatoire-32-caracteres-minimum
ENCRYPTION_KEY=cle-encryption-32-caracteres

# URLs publiques
NEXT_PUBLIC_APP_URL=https://questpulse.store
NEXT_PUBLIC_WEBSOCKET_URL=wss://questpulse.store/ws

# Google OAuth (optionnel)
GOOGLE_CLIENT_ID=votre-client-id
GOOGLE_CLIENT_SECRET=votre-client-secret
```

### 3. Lancer les services

```bash
# Construire et démarrer tous les services
docker compose up -d --build

# Vérifier que tout fonctionne
docker compose ps

# Voir les logs en temps réel
docker compose logs -f
```

### 4. Configurer Nginx (sur le serveur hôte)

```bash
# Déployer les configurations nginx
sudo ./scripts/deploy-nginx.sh

# Vérifier la configuration
sudo nginx -t

# Recharger nginx
sudo systemctl reload nginx
```

### 5. Accéder aux services

- **GoalCraftAI** : https://questpulse.store
- **n8n** : https://n8n.questpulse.store (user: admin, password: dans .env)
- **WebSocket** : wss://questpulse.store/ws (intégré)

## 📦 Services Détaillés

### GoalCraftAI (questpulse.store)

- **Framework** : Next.js 15 avec App Router
- **Features** : Gamification d'objectifs, chat IA, skill tree interactif
- **Ports** : 3000 (Next.js) + 3002 (WebSocket)
- **WebSocket** : Lancé automatiquement avec `concurrently` dans le même container
- **Route WebSocket** : `/ws` proxifié par nginx vers port 3002

### n8n (n8n.questpulse.store)

- **Rôle** : Workflow automation pour génération IA
- **Port** : 5678
- **Auth** : Basic Auth (admin / password dans .env)
- **Webhooks** : Intégration avec GoalCraft pour génération d'objectifs

### MongoDB

- **Port** : 27017
- **Database** : goalcraft
- **Auth** : admin / password dans .env
- **Volume** : goalcraft_mongodb_data (persistant)

## 🔧 Gestion des Services

### Docker Services

```bash
# Démarrer tous les services
docker compose up -d

# Arrêter tous les services  
docker compose down

# Redémarrer un service spécifique
docker compose restart n8n
docker compose restart client-backend

# Voir les logs
docker compose logs -f n8n
docker compose logs -f client-backend
```

### Mise à jour de GoalCraftAI

```bash
# Si GoalCraft est cloné directement
cd services/goalcraft
git pull origin main
cd ../..

# Reconstruire après mise à jour
docker compose up -d --build goalcraft-app
```

### Configuration WebSocket

Le WebSocket est **intégré dans le container GoalCraft** et lancé automatiquement :

1. **Dockerfile modifié** : Lance Next.js ET WebSocket via `concurrently`
2. **Port 3002** : WebSocket server interne
3. **Route nginx** : `/ws` proxy vers localhost:3002
4. **URL cliente** : `wss://questpulse.store/ws`

```javascript
// Connexion côté client
const ws = new WebSocket('wss://questpulse.store/ws');
```

## 📊 Monitoring

### Vérifier l'état des services

```bash
# État des conteneurs Docker
docker compose ps

# Logs nginx par service
tail -f /var/log/nginx/n8n.access.log
tail -f /var/log/nginx/client.access.log

# Utilisation des ressources
docker stats
```

## 🔐 Sécurité

### Configuration SSL

Les certificats Let's Encrypt sont générés automatiquement pour chaque domaine configuré.

```bash
# Vérifier les certificats
sudo certbot certificates

# Renouvellement manuel
sudo certbot renew
```

### Sauvegarde Volumes Docker

```bash
# Backup d'un volume spécifique
./scripts/backup-docker-volumes.sh mongo_data

# Restaurer un volume
./scripts/restore-docker-volume.sh backups/mongo_data_20240126_143022.tar.gz mongo_data
```

## 🛠️ Scripts Utiles

### Scripts disponibles

- **deploy-nginx.sh** : Déploiement nginx avec backup automatique
- **backup-docker-volumes.sh** : Backup des volumes Docker
- **restore-docker-volume.sh** : Restauration de volumes Docker

### Commandes Docker utiles

```bash
# Rebuild complet de GoalCraft
docker compose up -d --build goalcraft-app

# Voir les logs du WebSocket
docker compose logs -f goalcraft-app | grep "WS"

# Redémarrer n8n
docker compose restart n8n

# Stats en temps réel
docker stats
```

## 📚 Documentation

- **[CLAUDE.md](CLAUDE.md)** : Guide complet pour le développement
- **[.env.example](.env.example)** : Template des variables d'environnement

## 🆘 Troubleshooting

### WebSocket ne se connecte pas

1. **Vérifier que le WebSocket est lancé** :
   ```bash
   docker compose logs goalcraft-app | grep "3002"
   # Doit afficher : "🚀 Serveur WebSocket démarré sur le port 3002"
   ```

2. **Tester la route nginx** :
   ```bash
   curl -i -N -H "Connection: Upgrade" \
        -H "Upgrade: websocket" \
        https://questpulse.store/ws
   ```

3. **Vérifier les ports dans le container** :
   ```bash
   docker exec goalcraft-app netstat -tlnp
   ```

### n8n ne génère pas les objectifs

1. **Vérifier la connexion** :
   ```bash
   curl https://n8n.questpulse.store/healthz
   ```

2. **Vérifier les webhooks** :
   - Accéder à n8n : https://n8n.questpulse.store
   - Vérifier que le workflow est actif
   - Tester le webhook manuellement

### MongoDB connection error

1. **Vérifier que MongoDB est lancé** :
   ```bash
   docker compose ps goalcraft-mongodb
   ```

2. **Tester la connexion** :
   ```bash
   docker exec -it goalcraft-mongodb mongosh \
     --username admin \
     --password $MONGO_PASSWORD
   ```

## 🆘 Dépannage (Legacy)

### Problèmes Docker

```bash
# Reconstruire un service
docker compose up -d --build client-backend

# Nettoyer l'espace Docker
docker system prune
```

### Problèmes Nginx

```bash
# Test de configuration
sudo nginx -t

# Redémarrage complet
sudo systemctl restart nginx
```

## 🚀 Déploiement Production

### Checklist avant production

- [ ] Changer TOUS les mots de passe dans `.env`
- [ ] Configurer les DNS pour questpulse.store et n8n.questpulse.store
- [ ] Installer Certbot et générer les certificats SSL
- [ ] Configurer les backups MongoDB automatiques
- [ ] Mettre en place un monitoring (Prometheus/Grafana)
- [ ] Configurer un firewall (ufw)
- [ ] Activer les logs rotatifs

### Backup MongoDB

```bash
# Backup manuel
docker exec goalcraft-mongodb mongodump \
  --out /backup \
  --uri="mongodb://admin:${MONGO_PASSWORD}@localhost:27017"

# Avec le script
./scripts/backup-docker-volumes.sh goalcraft_mongodb_data
```

## 📚 Documentation

- **[CLAUDE.md](CLAUDE.md)** : Guide complet pour le développement
- **[services/goalcraft/](services/goalcraft/)** : Code source GoalCraftAI
- **[.env.example](.env.example)** : Template des variables d'environnement

## 🔐 Sécurité

- **SSL/TLS** : Certificats Let's Encrypt auto-renouvelés
- **Auth n8n** : Basic Auth configuré
- **NextAuth** : JWT sécurisé pour GoalCraft
- **MongoDB** : Authentification activée
- **Réseau** : Communication inter-services via réseau Docker interne
- **Ports** : Seuls 80/443 exposés publiquement

## 📊 Monitoring

```bash
# Health checks
curl https://questpulse.store/api/health
curl https://n8n.questpulse.store/healthz

# Logs en temps réel
docker compose logs -f --tail=100

# Métriques Docker
docker stats
```

## 🤝 Support

Pour toute question :
- Créer une issue sur GitHub
- Repository : https://github.com/loisperrigon/infrastructure-goalcraft

## 📄 Licence

Propriétaire - Lois Perrigon

---

<p align="center">
  <strong>Infrastructure GoalCraftAI</strong><br>
  Next.js + WebSocket + n8n + MongoDB 🚀
</p>