# Инструкция по деплою на хост (Production)

## 📋 Требования к серверу

- Ubuntu/Debian Linux
- Node.js 18+ и npm
- Git
- PM2 (для управления процессами)
- Nginx (для reverse proxy)

---

## 🚀 Команды для деплоя на хост

### 1. Подключение к серверу

```bash
ssh user@your-server-ip
# или
ssh user@s7robotics.space
```

### 2. Установка зависимостей (если еще не установлены)

```bash
# Обновить систему
sudo apt update && sudo apt upgrade -y

# Установить Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Установить PM2 глобально
sudo npm install -g pm2

# Установить Nginx (если нужен)
sudo apt install -y nginx
```

### 3. Клонирование репозитория

```bash
# Перейти в директорию для проектов
cd /var/www

# Клонировать репозиторий (или git pull если уже есть)
sudo git clone https://github.com/your-username/s7-new.git
# или
cd /var/www/s7 && sudo git pull

# Установить права
sudo chown -R $USER:$USER /var/www/s7
cd /var/www/s7
```

### 4. Настройка переменных окружения

```bash
# Создать .env файл
nano .env
```

Вставьте следующее содержимое (замените значения на свои):

```env
# Database - для production используем SQLite
DATABASE_URL=file:./dev.db

# Security - ОБЯЗАТЕЛЬНО смените на свой секретный ключ!
APP_SECRET=your-very-secure-secret-key-min-32-chars-production

# Server
PORT=4000
NODE_ENV=production

# Media Storage
MEDIA_DIR=/var/www/s7/media

# CORS - ваш домен
CORS_ORIGIN=https://s7robotics.space

# Frontend URL
NEXT_PUBLIC_API_URL=https://s7robotics.space

# Email (для отправки кодов верификации)
EMAIL_PASSWORD=your-gmail-app-password
```

Сохраните (Ctrl+O, Enter, Ctrl+X).

### 5. Установка зависимостей проекта

```bash
# Установить зависимости для frontend
npm install

# Установить зависимости для backend
cd server
npm install
cd ..
```

### 6. Настройка базы данных

```bash
# Создать базу данных
npx prisma db push

# Создать администратора
node create-admin.js
```

Данные администратора:
- **Email:** ch.qynon@gmail.com
- **Пароль:** admin123

**ВАЖНО:** После первого входа обязательно смените пароль!

### 7. Сборка проектов

```bash
# Собрать frontend
npm run build

# Собрать backend
cd server
npm run build
cd ..
```

### 8. Запуск с PM2

```bash
# Запустить backend
pm2 start server/dist/index.js --name "s7-backend" --node-args="--env-file=.env"

# Запустить frontend
pm2 start npm --name "s7-frontend" -- start

# Сохранить конфигурацию PM2
pm2 save

# Настроить автозапуск при перезагрузке
pm2 startup
# Выполните команду, которую предложит PM2
```

### 9. Настройка Nginx (опционально)

```bash
# Создать конфигурацию Nginx
sudo nano /etc/nginx/sites-available/s7robotics
```

Вставьте конфигурацию:

```nginx
server {
    listen 80;
    server_name s7robotics.space www.s7robotics.space;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Media files
    location /media {
        alias /var/www/s7/media;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Активируйте конфигурацию:

```bash
# Создать симлинк
sudo ln -s /etc/nginx/sites-available/s7robotics /etc/nginx/sites-enabled/

# Проверить конфигурацию
sudo nginx -t

# Перезапустить Nginx
sudo systemctl restart nginx
```

### 10. Настройка SSL (HTTPS) с Let's Encrypt

```bash
# Установить Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получить SSL сертификат
sudo certbot --nginx -d s7robotics.space -d www.s7robotics.space

# Автообновление сертификата настроится автоматически
```

---

## 🔄 Обновление проекта (после изменений в коде)

```bash
# Подключиться к серверу
ssh user@s7robotics.space

# Перейти в директорию проекта
cd /var/www/s7

# Остановить приложения
pm2 stop all

# Получить последние изменения
git pull

# Установить новые зависимости (если есть)
npm install
cd server && npm install && cd ..

# Применить миграции БД (если были изменения в schema)
npx prisma db push

# Собрать проекты
npm run build
cd server && npm run build && cd ..

# Запустить приложения
pm2 restart all

# Проверить статус
pm2 status
```

---

## 📊 Полезные команды PM2

```bash
# Посмотреть статус всех процессов
pm2 status

# Посмотреть логи
pm2 logs

# Логи конкретного приложения
pm2 logs s7-backend
pm2 logs s7-frontend

# Перезапустить приложение
pm2 restart s7-backend
pm2 restart s7-frontend

# Остановить приложение
pm2 stop s7-backend

# Удалить из PM2
pm2 delete s7-backend

# Мониторинг в реальном времени
pm2 monit
```

---

## 🗄️ Команды для работы с базой данных

```bash
# Создать резервную копию БД
cp prisma/dev.db prisma/dev.db.backup.$(date +%Y%m%d_%H%M%S)

# Восстановить из резервной копии
cp prisma/dev.db.backup.YYYYMMDD_HHMMSS prisma/dev.db

# Открыть Prisma Studio (будет доступен на порту 5555)
npx prisma studio

# Пересоздать БД (УДАЛИТ ВСЕ ДАННЫЕ!)
rm -f prisma/dev.db
npx prisma db push
node create-admin.js
```

---

## 🔧 Устранение проблем

### База данных не работает

```bash
cd /var/www/s7
npx prisma generate
npx prisma db push
pm2 restart s7-backend
```

### Приложение не запускается

```bash
# Проверить логи
pm2 logs s7-backend --lines 100
pm2 logs s7-frontend --lines 100

# Проверить порты
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :4000

# Перезапустить
pm2 restart all
```

### Очистить кеш и пересобрать

```bash
cd /var/www/s7
rm -rf .next
rm -rf server/dist
npm run build
cd server && npm run build && cd ..
pm2 restart all
```

---

## 📁 Структура на сервере

```
/var/www/s7/
├── .env                    # Конфигурация (НЕ коммитится в git)
├── prisma/
│   └── dev.db             # База данных SQLite
├── media/                 # Загруженные файлы
├── server/                # Backend
│   ├── dist/              # Собранный backend
│   └── src/               # Исходники backend
├── .next/                 # Собранный frontend
└── ...
```

---

## 🔐 Безопасность

1. **Смените APP_SECRET** в .env на уникальный ключ
2. **Смените пароль администратора** после первого входа
3. **Настройте firewall:**
   ```bash
   sudo ufw allow 22/tcp    # SSH
   sudo ufw allow 80/tcp    # HTTP
   sudo ufw allow 443/tcp   # HTTPS
   sudo ufw enable
   ```
4. **Регулярно создавайте резервные копии БД**
5. **Используйте HTTPS** (Let's Encrypt)

---

## 📝 Чеклист деплоя

- [ ] Сервер обновлен (apt update && apt upgrade)
- [ ] Node.js 18+ установлен
- [ ] PM2 установлен
- [ ] Репозиторий склонирован
- [ ] .env файл настроен с правильными значениями
- [ ] APP_SECRET изменен на уникальный
- [ ] Зависимости установлены (npm install)
- [ ] База данных создана (npx prisma db push)
- [ ] Администратор создан (node create-admin.js)
- [ ] Проекты собраны (npm run build)
- [ ] PM2 процессы запущены
- [ ] Nginx настроен (если используется)
- [ ] SSL сертификат установлен
- [ ] Firewall настроен
- [ ] Пароль администратора изменен

---

## 👤 Данные администратора по умолчанию

- **Email:** ch.qynon@gmail.com
- **Пароль:** admin123

⚠️ **ОБЯЗАТЕЛЬНО смените пароль после первого входа!**
