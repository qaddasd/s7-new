# Инструкция по деплою на хост

## Проблема
На хосте (s7robotics.space) приложение не загружается, потому что frontend не может подключиться к backend API.

## Решение

### Вариант 1: Nginx Proxy (Рекомендуется)
Настройте nginx на хосте для проксирования API запросов:

```nginx
# /etc/nginx/sites-available/s7robotics.space

server {
    server_name s7robotics.space;
    
    # Frontend (Next.js на порту 3000)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend API (Express на порту 4000)
    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /auth/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /courses/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
    
    location /uploads/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
    
    location /media/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    listen 443 ssl;
    ssl_certificate /путь/к/сертификату.crt;
    ssl_certificate_key /путь/к/ключу.key;
}

server {
    if ($host = s7robotics.space) {
        return 301 https://$host$request_uri;
    }
    
    listen 80;
    server_name s7robotics.space;
    return 404;
}
```

После изменения конфига:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Вариант 2: Переменная окружения NEXT_PUBLIC_API_URL

Если backend на отдельном домене/порту, создайте `.env.production`:

```env
# .env.production
NEXT_PUBLIC_API_URL=https://api.s7robotics.space
# или
NEXT_PUBLIC_API_URL=https://s7robotics.space:4000
```

Затем пересоберите frontend:
```bash
npm run build
npm start
```

### Вариант 3: Backend на том же порту через rewrites

Если используете standalone режим Next.js, убедитесь что backend запущен на том же хосте и порту.

## Проверка

После настройки откройте консоль браузера (F12) и проверьте:
1. Нет ли ошибок сети (Network tab)
2. Успешно ли выполняются запросы к `/api/*`
3. Возвращается ли данные от backend

## Текущая архитектура

### Development (локалка):
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Next.js rewrites проксирует `/api/*` → `localhost:4000/api/*`

### Production (хост):
- Frontend: https://s7robotics.space
- Backend: должен быть доступен через nginx proxy или переменную окружения

## Команды для запуска на хосте

```bash
# Backend (в директории server/)
cd server
npm install
npm run build
npm start  # запустится на порту 4000

# Frontend (в корне проекта)
npm install
npm run build
npm start  # запустится на порту 3000
```

## PM2 для автозапуска

```bash
# Установка PM2
npm install -g pm2

# Backend
cd server
pm2 start npm --name "s7-backend" -- start
pm2 save

# Frontend
cd ..
pm2 start npm --name "s7-frontend" -- start
pm2 save

# Автозапуск при перезагрузке
pm2 startup
pm2 save
```

## Проверка портов

```bash
# Проверить что порты открыты
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :4000

# Проверить firewall
sudo ufw status
# Если нужно открыть порты:
# sudo ufw allow 3000
# sudo ufw allow 4000
```

## Логи для отладки

```bash
# PM2 логи
pm2 logs s7-backend
pm2 logs s7-frontend

# Nginx логи
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```
