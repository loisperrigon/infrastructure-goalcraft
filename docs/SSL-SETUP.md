# Configuration SSL - Deux approches

## Option 1 : Un certificat pour tous les domaines (ACTUEL - RECOMMANDÉ)

### Avantages
- ✅ Un seul certificat à gérer
- ✅ Renouvellement plus simple
- ✅ Moins de requêtes Let's Encrypt

### Configuration actuelle
```bash
# Un certificat contenant DEUX domaines
certbot certonly --standalone \
  -d questpulse.store \
  -d n8n.questpulse.store \
  --expand
```

**Résultat :** 
- Certificat stocké dans : `/etc/letsencrypt/live/n8n.questpulse.store/`
- Contient : questpulse.store ET n8n.questpulse.store
- Les deux configs nginx utilisent le MÊME certificat

### Structure nginx
```nginx
# goalcraft.conf
ssl_certificate /etc/letsencrypt/live/n8n.questpulse.store/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/n8n.questpulse.store/privkey.pem;

# n8n.conf  
ssl_certificate /etc/letsencrypt/live/n8n.questpulse.store/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/n8n.questpulse.store/privkey.pem;
```

---

## Option 2 : Certificats séparés (SI VOUS PRÉFÉREZ)

### Avantages
- ✅ Isolation complète entre services
- ✅ Possibilité de révoquer un certificat sans affecter l'autre

### Comment faire
```bash
# Supprimer le certificat unifié
certbot delete --cert-name n8n.questpulse.store

# Créer deux certificats séparés
certbot certonly --standalone -d questpulse.store
certbot certonly --standalone -d n8n.questpulse.store
```

### Structure nginx avec certificats séparés
```nginx
# goalcraft.conf
ssl_certificate /etc/letsencrypt/live/questpulse.store/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/questpulse.store/privkey.pem;

# n8n.conf
ssl_certificate /etc/letsencrypt/live/n8n.questpulse.store/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/n8n.questpulse.store/privkey.pem;
```

---

## Quelle option choisir ?

### Utilisez l'Option 1 (certificat unifié) si :
- Vous voulez la simplicité
- Les services sont liés (même projet)
- Vous voulez minimiser la maintenance

### Utilisez l'Option 2 (certificats séparés) si :
- Les services sont indépendants
- Vous voulez pouvoir révoquer/modifier un certificat sans toucher l'autre
- Vous prévoyez de séparer les services sur différents serveurs plus tard

## Commande pour vérifier vos certificats

```bash
# Voir tous vos certificats
certbot certificates

# Tester le renouvellement
certbot renew --dry-run
```