#!/bin/bash
# Быстрый скрипт для деплоя S7 Robotics на production сервер

set -e  # Выход при ошибке

echo "🚀 S7 Robotics - Production Deploy Script"
echo "=========================================="

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Обновление кода
echo -e "${YELLOW}📥 Получение последних изменений...${NC}"
git pull

# 2. Остановка приложений
echo -e "${YELLOW}⏸️  Остановка приложений...${NC}"
pm2 stop all || true

# 3. Установка зависимостей
echo -e "${YELLOW}📦 Установка зависимостей...${NC}"
npm install
cd server && npm install && cd ..

# 4. Применение изменений БД
echo -e "${YELLOW}🗄️  Применение изменений БД...${NC}"
npx prisma generate
npx prisma db push

# 5. Сборка проектов
echo -e "${YELLOW}🔨 Сборка проектов...${NC}"
npm run build
cd server && npm run build && cd ..

# 6. Запуск приложений
echo -e "${YELLOW}▶️  Запуск приложений...${NC}"
pm2 restart all || pm2 start ecosystem.config.js

# 7. Сохранение конфигурации PM2
pm2 save

# 8. Проверка статуса
echo -e "${GREEN}✅ Деплой завершен!${NC}"
echo ""
pm2 status
echo ""
echo -e "${GREEN}🎉 S7 Robotics успешно обновлен!${NC}"
echo ""
echo "Проверьте логи: pm2 logs"
echo "Мониторинг: pm2 monit"
