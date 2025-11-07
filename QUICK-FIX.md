# 🚨 БЫСТРОЕ ИСПРАВЛЕНИЕ: Не работает на хосте

## Проблема
Приложение не загружается на `s7robotics.space` - показывает только "Загрузка..." или пустой экран.

## Причина
Frontend не может подключиться к backend API, потому что rewrites из `next.config.mjs` работают только локально.

## ✅ РЕШЕНИЕ (выберите один вариант)

### Вариант 1: Nginx Proxy (РЕКОМЕНДУЕТСЯ)

1. Отредактируйте конфиг nginx:
```bash
sudo nano /etc/nginx/sites-available/s7robotics.space
```

2. Добавьте проксирование для API:
```nginx
server {
    server_name s7robotics.space;
    
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
    location /api/ {
        proxy_pass http://localhost:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
    
    location /auth/ {
        proxy_pass http://localhost:4000/auth/;
    }
    
    location /courses/ {
        proxy_pass http://localhost:4000/courses/;
    }
    
    location /uploads/ {
        proxy_pass http://localhost:4000/uploads/;
    }
    
    location /media/ {
        proxy_pass http://localhost:4000/media/;
    }

    listen 443 ssl;
    # ... SSL настройки ...
}
```

3. Перезагрузите nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Вариант 2: Переменная окружения

Если backend на другом домене/порту:

1. Создайте `.env.production` в корне проекта:
```env
NEXT_PUBLIC_API_URL=https://api.s7robotics.space
```

2. Пересоберите и перезапустите:
```bash
npm run build
pm2 restart s7-frontend
```

## 🧪 ПРОВЕРКА

1. Откройте в браузере: `https://s7robotics.space/check-api.html`
2. Нажмите "Запустить тесты"
3. Все тесты должны быть ✅ зелёными

ИЛИ проверьте вручную:
```bash
# На сервере:
curl http://localhost:4000/api/health
# Должен вернуть: {"status":"ok"}

curl https://s7robotics.space/api/health
# Тоже должен вернуть: {"status":"ok"}
```

## 🔍 ДИАГНОСТИКА

Если не работает, проверьте:

### 1. Запущен ли backend?
```bash
pm2 list
# Должен показать s7-backend в статусе "online"

pm2 logs s7-backend --lines 50
# Должны быть логи запуска без ошибок
```

### 2. На каком порту работает backend?
```bash
sudo netstat -tlnp | grep node
# Должен показать что node слушает порт 4000
```

### 3. Проверка nginx конфига:
```bash
sudo nginx -t
# Должно быть: syntax is ok, test is successful
```

### 4. Логи nginx:
```bash
sudo tail -f /var/log/nginx/error.log
# Смотрите на ошибки при обращении к /api/*
```

### 5. Firewall:
```bash
sudo ufw status
# Порты 80, 443 должны быть открыты
```

## 📊 АРХИТЕКТУРА

### Локально:
```
Browser → localhost:3000 (Next.js) → rewrites → localhost:4000 (Express)
```

### На хосте (ПРАВИЛЬНО):
```
Browser → s7robotics.space:443 (Nginx) → {
  / → localhost:3000 (Next.js)
  /api/* → localhost:4000 (Express)
}
```

### На хосте (НЕПРАВИЛЬНО - текущая проблема):
```
Browser → s7robotics.space:443 (Nginx) → localhost:3000 (Next.js)
Next.js rewrites НЕ РАБОТАЮТ в production, запросы к /api/* идут в никуда
```

## 📞 ЧТО ДЕЛАТЬ ЕСЛИ НИЧЕГО НЕ ПОМОГЛО

1. Проверьте что backend запущен: `pm2 logs s7-backend`
2. Проверьте что frontend запущен: `pm2 logs s7-frontend`
3. Посмотрите консоль браузера (F12 → Network) - там будут видны ошибки 404/502
4. Проверьте порты: `sudo netstat -tlnp | grep :4000`
5. Пришлите скриншот:
   - Browser console (F12 → Console)
   - Network tab (F12 → Network)
   - `pm2 list`
   - `sudo nginx -t`

## ⚡ КОМАНДЫ ДЛЯ КОПИПАСТА

```bash
# Полный перезапуск всего
cd /path/to/s7-new
git pull
npm install

cd server
npm install
pm2 restart s7-backend

cd ..
npm run build
pm2 restart s7-frontend

# Проверка
curl http://localhost:4000/api/health
curl https://s7robotics.space/api/health
```
