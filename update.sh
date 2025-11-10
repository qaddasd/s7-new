#!/bin/bash
# Скрипт для обновления проекта на сервере
# Использование: bash update.sh

set -e

echo "🔄 Обновление S7 Robotics Platform"
echo "===================================="

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Получаем директорию проекта
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

info "Директория проекта: $PROJECT_DIR"

# Проверяем есть ли изменения в git
if git diff-index --quiet HEAD --; then
    info "Нет локальных изменений"
else
    warning "Есть локальные изменения, создаём stash"
    git stash
fi

# Обновляем код
info "Получение последних изменений..."
git pull

# Проверяем изменения в package.json
if git diff HEAD@{1} --name-only | grep -q "package.json"; then
    info "package.json изменился, обновляем зависимости frontend..."
    npm install
fi

if git diff HEAD@{1} --name-only | grep -q "server/package.json"; then
    info "server/package.json изменился, обновляем зависимости backend..."
    cd server
    npm install
    cd ..
fi

# Применяем Prisma schema и миграции (схема лежит в ./prisma/schema.prisma)
warning "Применяем Prisma schema и миграции..."
cd server
npx prisma generate --schema ../prisma/schema.prisma
npx prisma migrate deploy --schema ../prisma/schema.prisma
cd ..

# Сборка backend
info "Сборка backend..."
cd server
npm run build
cd ..

# Сборка frontend
info "Сборка frontend..."
npm run build

# Перезапуск процессов
if command -v pm2 &> /dev/null; then
    info "Перезапуск процессов через PM2..."
    
    # Перезапуск backend
    if pm2 list | grep -q "s7-backend"; then
        info "Перезапуск backend..."
        pm2 restart s7-backend
    else
        warning "Backend не запущен через PM2, запускаем..."
        cd server
        pm2 start npm --name "s7-backend" -- start
        cd ..
    fi
    
    # Перезапуск frontend
    if pm2 list | grep -q "s7-frontend"; then
        info "Перезапуск frontend..."
        pm2 restart s7-frontend
    else
        warning "Frontend не запущен через PM2, запускаем..."
        pm2 start npm --name "s7-frontend" -- start
    fi
    
    # Сохраняем конфигурацию
    pm2 save
    
    # Показываем статус
    info "Статус процессов:"
    pm2 list
    
    # Ждём немного
    sleep 3
    
    # Проверяем здоровье
    info "Проверка backend health..."
    if curl -s http://localhost:4000/api/health | grep -q "ok"; then
        info "✅ Backend работает"
    else
        error "❌ Backend не отвечает"
        pm2 logs s7-backend --lines 20
    fi
    
    info "Проверка frontend..."
    if curl -s http://localhost:3000 | grep -q "html"; then
        info "✅ Frontend работает"
    else
        warning "⚠️ Frontend возможно не запустился"
        pm2 logs s7-frontend --lines 20
    fi
else
    warning "PM2 не установлен, перезапустите процессы вручную"
fi

echo ""
echo "===================================="
info "✅ Обновление завершено!"
echo ""
info "Проверьте работу:"
echo "  https://s7robotics.space"
echo "  https://s7robotics.space/check-api.html"
echo ""
info "Логи:"
echo "  pm2 logs s7-backend"
echo "  pm2 logs s7-frontend"
echo ""
