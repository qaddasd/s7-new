#!/bin/bash
# Скрипт для настройки production окружения на Ubuntu/Debian
# Использование: bash setup-production.sh

set -e

echo "🚀 Настройка production окружения для S7 Robotics"
echo "=================================================="

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка что запущено на Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    error "Этот скрипт предназначен для Linux (Ubuntu/Debian)"
    exit 1
fi

# Получаем директорию проекта
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
info "Директория проекта: $PROJECT_DIR"

# Проверяем наличие Node.js
if ! command -v node &> /dev/null; then
    error "Node.js не установлен. Установите Node.js 18+ и запустите скрипт снова."
    exit 1
fi

NODE_VERSION=$(node -v)
info "Node.js версия: $NODE_VERSION"

# Проверяем наличие npm
if ! command -v npm &> /dev/null; then
    error "npm не установлен"
    exit 1
fi

# Устанавливаем PM2 если его нет
if ! command -v pm2 &> /dev/null; then
    info "Установка PM2..."
    sudo npm install -g pm2
else
    info "PM2 уже установлен: $(pm2 -v)"
fi

# Установка зависимостей
info "Установка зависимостей..."
cd "$PROJECT_DIR"
npm install

info "Установка зависимостей backend..."
cd "$PROJECT_DIR/server"
npm install

# Сборка backend
info "Сборка backend..."
npm run build

# Сборка frontend
info "Сборка frontend..."
cd "$PROJECT_DIR"
npm run build

# Проверяем переменные окружения
if [ ! -f "$PROJECT_DIR/server/.env" ]; then
    warning "Файл server/.env не найден"
    warning "Создайте его на основе server/.env.example"
fi

# Останавливаем старые процессы если есть
info "Остановка старых процессов..."
pm2 delete s7-backend 2>/dev/null || true
pm2 delete s7-frontend 2>/dev/null || true

# Запуск backend
info "Запуск backend (порт 4000)..."
cd "$PROJECT_DIR/server"
pm2 start npm --name "s7-backend" -- start

# Ждём пока backend запустится
sleep 3

# Проверяем что backend работает
if curl -s http://localhost:4000/api/health | grep -q "ok"; then
    info "Backend успешно запущен ✓"
else
    error "Backend не отвечает на health check"
    pm2 logs s7-backend --lines 20
    exit 1
fi

# Запуск frontend
info "Запуск frontend (порт 3000)..."
cd "$PROJECT_DIR"
pm2 start npm --name "s7-frontend" -- start

# Ждём пока frontend запустится
sleep 3

# Проверяем что frontend работает
if curl -s http://localhost:3000 | grep -q "html"; then
    info "Frontend успешно запущен ✓"
else
    warning "Frontend возможно не запустился, проверьте логи"
fi

# Сохраняем конфигурацию PM2
info "Сохранение конфигурации PM2..."
pm2 save

# Настройка автозапуска
info "Настройка автозапуска при перезагрузке..."
pm2 startup | grep "sudo" | bash || true

# Показываем статус
info "Статус процессов:"
pm2 list

# Проверка nginx
if command -v nginx &> /dev/null; then
    info "Nginx установлен"
    
    NGINX_CONF="/etc/nginx/sites-available/s7robotics.space"
    if [ ! -f "$NGINX_CONF" ]; then
        warning "Конфиг nginx не найден: $NGINX_CONF"
        info "Скопируйте пример конфига:"
        echo "  sudo cp $PROJECT_DIR/nginx.conf.example $NGINX_CONF"
        echo "  sudo ln -s $NGINX_CONF /etc/nginx/sites-enabled/"
        echo "  sudo nginx -t"
        echo "  sudo systemctl reload nginx"
    else
        info "Конфиг nginx найден ✓"
        if sudo nginx -t 2>&1 | grep -q "test is successful"; then
            info "Конфиг nginx валидный ✓"
        else
            error "Ошибка в конфиге nginx"
            sudo nginx -t
        fi
    fi
else
    warning "Nginx не установлен. Установите для production:"
    echo "  sudo apt update"
    echo "  sudo apt install nginx"
fi

# Проверка SSL сертификата
if command -v certbot &> /dev/null; then
    info "Certbot установлен ✓"
else
    warning "Certbot не установлен. Установите для SSL:"
    echo "  sudo apt install certbot python3-certbot-nginx"
    echo "  sudo certbot --nginx -d s7robotics.space"
fi

# Firewall
if command -v ufw &> /dev/null; then
    info "Проверка firewall..."
    if sudo ufw status | grep -q "Status: active"; then
        info "Firewall активен"
        if ! sudo ufw status | grep -q "80.*ALLOW"; then
            warning "Порт 80 не открыт. Откройте:"
            echo "  sudo ufw allow 80"
        fi
        if ! sudo ufw status | grep -q "443.*ALLOW"; then
            warning "Порт 443 не открыт. Откройте:"
            echo "  sudo ufw allow 443"
        fi
    fi
fi

echo ""
echo "=================================================="
info "✅ Установка завершена!"
echo ""
info "Проверьте работу:"
echo "  curl http://localhost:4000/api/health"
echo "  curl http://localhost:3000"
echo ""
info "Логи процессов:"
echo "  pm2 logs s7-backend"
echo "  pm2 logs s7-frontend"
echo "  pm2 monit"
echo ""
info "Управление процессами:"
echo "  pm2 restart all     # Перезапустить всё"
echo "  pm2 stop all        # Остановить всё"
echo "  pm2 list            # Список процессов"
echo ""
info "Следующие шаги:"
echo "  1. Настройте nginx (см. nginx.conf.example)"
echo "  2. Получите SSL сертификат: sudo certbot --nginx -d s7robotics.space"
echo "  3. Откройте https://s7robotics.space/check-api.html для проверки"
echo ""
