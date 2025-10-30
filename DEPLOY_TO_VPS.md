# VPS-қа Deploy жасау нұсқаулығы

## 1. Өзгерістерді GitHub-қа push жасау

### Sandbox-тан GitHub-қа push

```bash
cd /home/ubuntu/s7-platform

# Git конфигурациясын орнату (егер жасалмаған болса)
git config user.name "Your Name"
git config user.email "your-email@example.com"

# Барлық өзгерістерді қосу
git add .

# Commit жасау
git commit -m "Added News module with admin panel and public pages"

# GitHub-қа push жасау
git push origin main
```

**Ескерту:** Егер authentication қажет болса:
- GitHub Personal Access Token қолданыңыз
- Немесе SSH key орнатыңыз

---

## 2. VPS-та орнату

### 2.1. VPS-қа қосылу

```bash
ssh your-user@your-vps-ip
```

### 2.2. Жобаны клондау немесе pull жасау

**Егер бұрын клондалмаған болса:**
```bash
cd /var/www  # немесе өзіңіздің қалаған қалтаңыз
git clone https://github.com/qaddasd/s7-platform.git
cd s7-platform
```

**Егер бұрын клондалған болса:**
```bash
cd /var/www/s7-platform  # жобаңыздың орналасқан жері
git pull origin main
```

### 2.3. Тәуелділіктерді орнату

```bash
# Frontend тәуелділіктері
npm install
# немесе
pnpm install

# Backend тәуелділіктері
cd server
npm install
cd ..
```

### 2.4. Дерекқорды жаңарту

```bash
# Prisma миграциясын жасау
npx prisma generate
npx prisma db push

# Немесе миграция файлдарымен
npx prisma migrate deploy
```

### 2.5. Environment файлдарын орнату

**Root қалтада `.env` файлын жасау/жаңарту:**
```bash
nano .env
```

```env
DATABASE_URL=postgresql://s7_user:your_password@localhost:5432/s7_prod?schema=public
```

**Server қалтасында `.env` файлын жасау/жаңарту:**
```bash
nano server/.env
```

```env
DATABASE_URL=postgresql://s7_user:your_password@localhost:5432/s7_prod?schema=public
APP_SECRET=your_secret_key_here
PORT=3001
MEDIA_DIR=/var/www/s7/media
CORS_ORIGIN=https://your-domain.com
```

### 2.6. Admin пайдаланушы құру

```bash
# Admin құру скриптін іске қосу
node create-admin.js

# Email верифицировать ету
node verify-admin.js
```

---

## 3. Production режимінде іске қосу

### 3.1. PM2 арқылы іске қосу (ұсынылады)

**PM2 орнату (егер жоқ болса):**
```bash
npm install -g pm2
```

**Backend серверді іске қосу:**
```bash
cd server
pm2 start npm --name "s7-backend" -- run dev
# немесе production үшін:
pm2 start npm --name "s7-backend" -- start
```

**Frontend іске қосу:**
```bash
cd /var/www/s7-platform
npm run build
pm2 start npm --name "s7-frontend" -- start
```

**PM2 процестерді сақтау:**
```bash
pm2 save
pm2 startup
```

### 3.2. Nginx конфигурациясы

**Nginx конфигурация файлын жаңарту:**
```bash
sudo nano /etc/nginx/sites-available/s7-platform
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Media files
    location /media {
        alias /var/www/s7/media;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

**Nginx қайта іске қосу:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 4. Тексеру

### 4.1. Процестерді тексеру

```bash
# PM2 процестер
pm2 list

# PM2 логтар
pm2 logs s7-backend
pm2 logs s7-frontend
```

### 4.2. Сайтты тексеру

- **Frontend:** http://your-domain.com
- **Жаңалықтар:** http://your-domain.com/news
- **Админ панель:** http://your-domain.com/admin/news

### 4.3. API тексеру

```bash
curl http://localhost:3001/health
curl http://localhost:3001/api/news
```

---

## 5. SSL сертификатын орнату (HTTPS)

```bash
# Certbot орнату
sudo apt install certbot python3-certbot-nginx

# SSL сертификат алу
sudo certbot --nginx -d your-domain.com

# Автоматты жаңарту
sudo certbot renew --dry-run
```

---

## 6. Жаңартулар үшін қысқа нұсқау

Келесі жолы өзгерістерді VPS-қа жүктеу үшін:

```bash
# VPS-та
cd /var/www/s7-platform
git pull origin main
npm install
cd server && npm install && cd ..
npx prisma generate
npx prisma db push
npm run build
pm2 restart all
```

---

## 7. Қауіпсіздік

### 7.1. Firewall орнату

```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 7.2. PostgreSQL қауіпсіздігі

```bash
# PostgreSQL тек localhost-тан қол жетімді болуы керек
sudo nano /etc/postgresql/*/main/postgresql.conf
# listen_addresses = 'localhost'

sudo systemctl restart postgresql
```

---

## 8. Backup

### 8.1. Дерекқор backup

```bash
# Backup жасау
pg_dump -U s7_user s7_prod > backup_$(date +%Y%m%d).sql

# Қалпына келтіру
psql -U s7_user s7_prod < backup_20241030.sql
```

### 8.2. Автоматты backup (cron)

```bash
crontab -e
```

```cron
# Күн сайын түнгі 2:00-де backup жасау
0 2 * * * pg_dump -U s7_user s7_prod > /var/backups/s7_backup_$(date +\%Y\%m\%d).sql
```

---

## Қорытынды

Барлық қадамдар орындалғаннан кейін:
- ✅ Жаңалықтар модулі VPS-та жұмыс істейді
- ✅ Admin панель қол жетімді
- ✅ HTTPS қауіпсіз байланыс
- ✅ PM2 автоматты қайта іске қосу
- ✅ Nginx reverse proxy
- ✅ Дерекқор backup

**Сәттілік!** 🚀
