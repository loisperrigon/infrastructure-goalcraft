# Guide de déploiement Next.js avec l'Infrastructure Template

## Configuration rapide

### 1. Structure du projet

```bash
infrastructure-template/
├── services/
│   └── goalcraft-nextjs/        # Votre app Next.js
│       ├── src/
│       ├── public/
│       ├── package.json
│       ├── next.config.js
│       └── Dockerfile           # Copier depuis examples/dockerfiles/
```

### 2. Ajouter votre application Next.js

```bash
# Option A: Submodule Git
git submodule add https://github.com/yourusername/goalcraft-nextjs.git services/goalcraft-nextjs
git submodule update --init --recursive

# Option B: Copier directement
cp -r /path/to/your/nextjs-app services/goalcraft-nextjs
```

### 3. Copier les fichiers de configuration

```bash
# Copier le Dockerfile
cp examples/dockerfiles/Dockerfile.nextjs services/goalcraft-nextjs/Dockerfile
cp examples/dockerfiles/Dockerfile.nextjs.dev services/goalcraft-nextjs/Dockerfile.dev

# Copier la config nginx
cp examples/nginx-templates/nextjs.conf.template nginx/sites-available/goalcraft.conf
```

### 4. Configurer les variables d'environnement

```bash
# Copier le template
cp .env.example .env

# Ajouter les variables Next.js depuis le template
cat examples/.env.nextjs.example >> .env

# Éditer les valeurs
nano .env
```

Variables essentielles à configurer:
- `NEXT_PUBLIC_APP_URL=https://goalcraft.ai`
- `NEXT_PUBLIC_API_URL=https://api.goalcraft.ai`
- `NEXTAUTH_SECRET` (générer avec: `openssl rand -base64 32`)
- `DATABASE_URL` (votre connection string)

### 5. Modifier docker-compose.yml

```yaml
version: '3.8'

services:
  # Next.js Application
  nextjs-app:
    build:
      context: ./services/goalcraft-nextjs/
      dockerfile: Dockerfile
      args:
        - NODE_ENV=production
        - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
        - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    restart: always
    ports:
      - "127.0.0.1:3000:3000"
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL}
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
      DATABASE_URL: ${DATABASE_URL}
      NEXTAUTH_URL: ${NEXTAUTH_URL}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
    env_file:
      - .env
    volumes:
      - nextjs_cache:/app/.next/cache
    depends_on:
      - postgres

  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    restart: always
    ports:
      - "127.0.0.1:5432:5432"
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-goalcraft}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-goalcraftdb}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Redis Cache (optionnel mais recommandé)
  redis:
    image: redis:7-alpine
    restart: always
    ports:
      - "127.0.0.1:6379:6379"
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data

volumes:
  nextjs_cache:
    driver: local
  postgres_data:
    driver: local
  redis_data:
    driver: local
```

### 6. Configurer Nginx

Éditer `nginx/sites-available/goalcraft.conf`:
- Remplacer `SERVICE_NAME` par `goalcraft`
- Remplacer `CLIENT_DOMAIN` par votre domaine (ex: `goalcraft.ai`)

### 7. Préparer next.config.js

Assurez-vous que votre `next.config.js` est configuré pour la production:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',  // Important pour Docker
  reactStrictMode: true,
  swcMinify: true,
  
  // Configuration des images si vous utilisez next/image
  images: {
    domains: ['yourdomain.com', 'cdn.yourdomain.com'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // Headers de sécurité
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### 8. Créer l'endpoint de health check

Créer `services/goalcraft-nextjs/src/app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { 
      status: 'healthy',
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  );
}
```

### 9. Déployer

```bash
# Déployer la configuration nginx
./scripts/deploy-nginx.sh

# Construire et lancer les services
docker compose up -d --build

# Vérifier les logs
docker compose logs -f nextjs-app

# Vérifier que tout fonctionne
curl https://yourdomain.com/api/health
```

## Commandes utiles

### Développement local

```bash
# Utiliser le Dockerfile de dev
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Ou directement
cd services/goalcraft-nextjs
npm run dev
```

### Mise à jour de l'application

```bash
# Si submodule
cd services/goalcraft-nextjs
git pull origin main
cd ../..
git add services/goalcraft-nextjs
git commit -m "Update Next.js app"

# Reconstruire
docker compose up -d --build nextjs-app
```

### Migrations de base de données (Prisma)

```bash
# Exécuter les migrations
docker compose exec nextjs-app npx prisma migrate deploy

# Créer une nouvelle migration
docker compose exec nextjs-app npx prisma migrate dev --name your_migration_name
```

### Monitoring et logs

```bash
# Logs de l'application
docker compose logs -f nextjs-app

# Logs nginx
tail -f /var/log/nginx/goalcraft.access.log
tail -f /var/log/nginx/goalcraft.error.log

# Statistiques Docker
docker stats nextjs-app
```

### Backup de la base de données

```bash
# Backup PostgreSQL
docker compose exec postgres pg_dump -U goalcraft goalcraftdb > backup.sql

# Ou utiliser le script de backup
./scripts/backup-docker-volumes.sh postgres_data
```

## Optimisations recommandées

### 1. Cache CDN
- Utiliser Cloudflare ou un CDN pour les assets statiques
- Configurer les headers de cache appropriés

### 2. Image Optimization
- Utiliser `next/image` pour l'optimisation automatique
- Configurer un CDN pour les images

### 3. Database Connection Pooling
- Utiliser PgBouncer pour PostgreSQL
- Configurer Prisma avec connection pooling

### 4. Monitoring
- Ajouter Sentry pour le tracking d'erreurs
- Configurer des health checks et alertes

## Troubleshooting

### Problème de build

```bash
# Nettoyer le cache
docker compose down
docker system prune -f
docker compose up -d --build
```

### Erreur de connexion à la base de données

```bash
# Vérifier la connexion
docker compose exec nextjs-app node -e "console.log(process.env.DATABASE_URL)"

# Tester la connexion
docker compose exec postgres psql -U goalcraft -d goalcraftdb
```

### Performance lente

```bash
# Vérifier l'utilisation des ressources
docker stats

# Augmenter les limites dans docker-compose.yml
services:
  nextjs-app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

## Structure recommandée pour Next.js App Router

```
services/goalcraft-nextjs/
├── src/
│   ├── app/
│   │   ├── api/          # API Routes
│   │   ├── (auth)/       # Grouped routes
│   │   └── page.tsx      # Home page
│   ├── components/
│   ├── lib/              # Utilities
│   └── styles/
├── public/
├── prisma/               # Si vous utilisez Prisma
│   └── schema.prisma
├── .env.local           # Variables locales (ne pas commit)
├── next.config.js
├── package.json
├── tsconfig.json
└── Dockerfile
```