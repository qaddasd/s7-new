#!/bin/bash
# Быстрый скрипт для деплоя S7 Robotics на production сервер

set -e  # Выход при ошибке

echo "🚀 S7 Robotics - Production Deploy Script v1.1"
echo "================================================"
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Проверка: нужно ли пересоздавать БД
echo -e "${YELLOW}⚠️  ВАЖНО: Если обновляете после исправления 'Сессия истекла',${NC}"
echo -e "${YELLOW}   ОБЯЗАТЕЛЬНО пересоздайте БД!${NC}"
echo ""
read -p "Пересоздать БД? (y/N): " -n 1 -r
echo ""

# 1. Остановка приложений
echo -e "${YELLOW}⏸️  Остановка приложений...${NC}"
pm2 stop all || true

# 2. Если нужно пересоздать БД
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}💾 Создание резервной копии БД...${NC}"
    cp prisma/dev.db prisma/dev.db.backup.$(date +%Y%m%d_%H%M%S) || true

    echo -e "${YELLOW}🗑️  Удаление старой БД...${NC}"
    rm -f prisma/dev.db prisma/dev.db-journal

    echo -e "${YELLOW}🧹 Очистка кеша...${NC}"
    rm -rf node_modules .next server/node_modules server/dist
fi

# 3. Обновление кода
echo -e "${YELLOW}📥 Получение последних изменений...${NC}"
git pull

# 4. Установка зависимостей
echo -e "${YELLOW}📦 Установка зависимостей...${NC}"
npm install
cd server && npm install && cd ..

# 5. Применение изменений БД
echo -e "${YELLOW}🗄️  Применение изменений БД...${NC}"
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx prisma db push --accept-data-loss
    npx prisma generate

    echo -e "${YELLOW}👤 Создание администратора...${NC}"
    node create-admin.js
else
    npx prisma generate
    npx prisma db push
fi

# 6. Сборка проектов
echo -e "${YELLOW}🔨 Сборка проектов...${NC}"
npm run build
cd server && npm run build && cd ..

# 7. Запуск приложений
echo -e "${YELLOW}▶️  Запуск приложений...${NC}"
pm2 restart all || pm2 start ecosystem.config.js

# 8. Сохранение конфигурации PM2
pm2 save

# 9. Проверка статуса
echo ""
echo -e "${GREEN}✅ Деплой завершен!${NC}"
echo ""
pm2 status
echo ""
echo -e "${YELLOW}📋 Логи (последние 20 строк):${NC}"
pm2 logs --lines 20 --nostream
echo ""
echo -e "${GREEN}🎉 S7 Robotics успешно обновлен!${NC}"
echo ""
echo "Команды:"
echo "  - Логи: pm2 logs"
echo "  - Мониторинг: pm2 monit"
echo "  - Статус: pm2 status"
