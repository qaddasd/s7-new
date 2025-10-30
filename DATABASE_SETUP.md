# Настройка базы данных

## Почему БД "слетает" при перезапуске?

Раньше были следующие проблемы:

1. **Prisma Client в node_modules** - при `npm install` в папке `server/` удалялся сгенерированный Prisma Client
2. **Относительный путь к БД** - schema.prisma игнорировал DATABASE_URL из .env
3. **Конфликт слияния в .env** - были некорректные настройки

## Что было исправлено

✅ Добавлен `postinstall` скрипт в `server/package.json` для автоматической генерации Prisma Client
✅ Schema.prisma теперь использует DATABASE_URL из .env
✅ Исправлен .env файл (удален конфликт слияния)
✅ DATABASE_URL указывает на абсолютный путь относительно корня проекта
✅ БД добавлена в .gitignore чтобы не коммитить локальную базу

## Быстрый старт

### 1. Первая установка

```bash
# Копировать .env.example в .env
cp .env.example .env

# Установить зависимости
npm install
cd server && npm install && cd ..

# Создать базу данных
npx prisma db push

# Сгенерировать Prisma Client
npx prisma generate

# Создать администратора
node create-admin.js
```

### 2. При перезапуске сервера

Теперь ничего делать не нужно! БД не будет слетать.

### 3. Если нужно пересоздать БД

```bash
# Удалить старую БД
rm -f prisma/dev.db

# Создать новую
npx prisma db push

# Создать администратора
node create-admin.js
```

### 4. Если после npm install в server/ БД не работает

```bash
# Prisma Client автоматически регенерируется через postinstall
# Но если нужно вручную:
npx prisma generate
```

## Данные для входа администратора

После выполнения `node create-admin.js`:

- **Email:** ch.qynon@gmail.com
- **Пароль:** admin123

⚠️ **ВАЖНО:** Обязательно смените пароль после первого входа!

## Команды для работы с БД

```bash
# Открыть Prisma Studio (UI для БД)
npx prisma studio

# Применить изменения в schema
npx prisma db push

# Сгенерировать Prisma Client
npx prisma generate

# Очистить все данные (но оставить таблицы)
npx prisma db push --force-reset
```

## Решение проблем

### Проблема: "Сессия истекла" при входе

**Решение:**
```bash
# Пересоздать БД
rm -f prisma/dev.db
npx prisma db push
node create-admin.js
```

### Проблема: Prisma Client не найден

**Решение:**
```bash
npx prisma generate
```

### Проблема: БД слетает при git pull

**Решение:**
- БД теперь в .gitignore, поэтому не будет перезаписываться при pull
- Если БД исчезла, просто запустите `npx prisma db push`
