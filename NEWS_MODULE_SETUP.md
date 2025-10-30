# Жаңалықтар модулін орнату нұсқаулығы / News Module Setup Guide

## Қысқаша шолу / Overview

Админ панельге жаңалықтар (новости) модулі қосылды. Бұл модуль арқылы әкімшілер жаңалықтарды құра алады, редакциялай алады және жариялай алады. Жаңалықтарға фото, видео, презентация, құжаттар және сілтемелер қосуға болады.

A news module has been added to the admin panel. Through this module, administrators can create, edit, and publish news. News can include photos, videos, presentations, documents, and links.

---

## Қосылған файлдар / Added Files

### 1. Дерекқор / Database
- **prisma/schema.prisma** - News және NewsAttachment модельдері қосылды

### 2. Backend API
- **server/src/routes/news.ts** - Жаңалықтар үшін API маршруттары
- **server/src/index.ts** - News router қосылды

### 3. Admin беттері / Admin Pages
- **app/admin/news/page.tsx** - Жаңалықтар тізімі (admin)
- **app/admin/news/new/page.tsx** - Жаңа жаңалық қосу
- **app/admin/news/[id]/page.tsx** - Жаңалықты редакциялау
- **components/admin/admin-sidebar.tsx** - Sidebar-ға "Новости" пункті қосылды

### 4. Пайдаланушы беттері / Public Pages
- **app/news/page.tsx** - Жаңалықтар тізімі (public)
- **app/news/[id]/page.tsx** - Жаңалықтың толық беті

---

## Орнату қадамдары / Installation Steps

### 1. Дерекқорды жаңарту / Update Database

```bash
cd /home/ubuntu/s7-platform

# Prisma миграциясын жасау
npx prisma migrate dev --name add_news_module

# Немесе дерекқорды қайта құру (ЕСКЕРТУ: барлық деректер жоғалады!)
# npx prisma db push
```

### 2. Тәуелділіктерді орнату / Install Dependencies

```bash
# Server тәуелділіктерін орнату
cd server
npm install

# Frontend тәуелділіктерін орнату
cd ..
pnpm install
# немесе
npm install
```

### 3. Сервер мен клиентті іске қосу / Start Server and Client

```bash
# Terminal 1: Backend сервер
cd server
npm run dev

# Terminal 2: Frontend (Next.js)
cd /home/ubuntu/s7-platform
pnpm dev
# немесе
npm run dev
```

---

## API Endpoints

### Public Endpoints (барлық пайдаланушылар үшін)

- **GET /api/news** - Барлық жарияланған жаңалықтарды алу
  - Query params: `page` (default: 1), `limit` (default: 10)
  
- **GET /api/news/:id** - Жаңалықтың толық ақпаратын алу

### Admin Endpoints (тек әкімшілер үшін)

- **GET /api/news/admin/all** - Барлық жаңалықтарды алу (черновиктерді қоса)
  - Query params: `page` (default: 1), `limit` (default: 20)

- **POST /api/news** - Жаңа жаңалық құру
  - Body: `{ title, content, coverImageUrl?, published, attachments? }`

- **PUT /api/news/:id** - Жаңалықты жаңарту
  - Body: `{ title?, content?, coverImageUrl?, published?, attachments? }`

- **DELETE /api/news/:id** - Жаңалықты жою

- **PATCH /api/news/:id/publish** - Жариялау статусын өзгерту
  - Body: `{ published: boolean }`

---

## Дерекқор схемасы / Database Schema

### News модель

```prisma
model News {
  id            String   @id @default(cuid())
  title         String
  content       String   @db.Text
  coverImageUrl String?
  published     Boolean  @default(false)
  publishedAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  authorId      String?
  author        User?    @relation("NewsAuthor", fields: [authorId], references: [id], onDelete: SetNull)
  
  attachments   NewsAttachment[]
}
```

### NewsAttachment модель

```prisma
model NewsAttachment {
  id          String   @id @default(cuid())
  news        News     @relation(fields: [newsId], references: [id], onDelete: Cascade)
  newsId      String
  type        String   // photo, video, presentation, document, link
  url         String
  title       String?
  description String?
  orderIndex  Int      @default(0)
  createdAt   DateTime @default(now())
}
```

---

## Мүмкіндіктер / Features

### Админ панель

1. **Жаңалықтар тізімі** (`/admin/news`)
   - Барлық жаңалықтарды көру (жарияланған және черновиктер)
   - Жаңалықты редакциялау
   - Жаңалықты жою
   - Жариялау/жариялаудан алу

2. **Жаңалық құру** (`/admin/news/new`)
   - Тақырып және мазмұн
   - Обложка суреті (URL)
   - Вложениялар қосу:
     - Фото (photo)
     - Видео (video)
     - Презентация (presentation)
     - Құжат (document)
     - Сілтеме (link)
   - Жариялау опциясы

3. **Жаңалықты редакциялау** (`/admin/news/[id]`)
   - Барлық өрістерді өзгерту
   - Вложениялар басқару
   - Жариялау статусын өзгерту

### Пайдаланушы беттері

1. **Жаңалықтар тізімі** (`/news`)
   - Жарияланған жаңалықтар
   - Pagination
   - Responsive дизайн

2. **Жаңалықтың толық беті** (`/news/[id]`)
   - Толық мазмұн
   - Вложениялар
   - Автор және күн

---

## Дизайн ерекшеліктері / Design Features

- ✅ Қараңғы тақырып (Dark theme) - сайттың жалпы стилімен сәйкес
- ✅ Анимациялар (fade-in, slide-up)
- ✅ Responsive дизайн (mobile, tablet, desktop)
- ✅ Hover эффектілері
- ✅ Түрлі түстер вложениялар үшін
- ✅ Lucide иконкалар

---

## Қауіпсіздік / Security

- ✅ Тек әкімшілер жаңалық құра/редакциялай/жоя алады
- ✅ Пайдаланушылар тек жарияланған жаңалықтарды көре алады
- ✅ Authentication middleware (requireAuth, requireAdmin)
- ✅ Input validation (Zod schemas)

---

## Келесі қадамдар / Next Steps

### Қосымша мүмкіндіктер (опционалды)

1. **Файл жүктеу** - Тікелей файл жүктеу (қазір тек URL)
2. **Rich text editor** - Мәтінді форматтау (bold, italic, links)
3. **Категориялар** - Жаңалықтарды категорияларға бөлу
4. **Іздеу** - Жаңалықтарды іздеу функциясы
5. **Комментарийлер** - Пайдаланушылар пікір қалдыра алады
6. **Лайктар** - Жаңалықтарға лайк қою
7. **Тегтер** - Жаңалықтарға тегтер қосу
8. **Көрсеткіштер** - Жаңалықты қанша адам көргенін есептеу

---

## Тестілеу / Testing

### 1. Админ панельді тестілеу

```bash
# 1. Браузерде ашу
http://localhost:3000/admin/news

# 2. Жаңа жаңалық құру
- "Добавить новость" батырмасын басу
- Форманы толтыру
- Вложениялар қосу
- Сақтау

# 3. Жаңалықты редакциялау
- Жаңалықты таңдау
- "Редактировать" батырмасын басу
- Өзгерістер енгізу
- Сақтау

# 4. Жариялау/жариялаудан алу
- "Опубликовать" немесе "Снять с публикации" батырмасын басу

# 5. Жою
- Жаңалықты таңдау
- Жою батырмасын басу
- Растау
```

### 2. Пайдаланушы беттерін тестілеу

```bash
# 1. Жаңалықтар тізімі
http://localhost:3000/news

# 2. Жаңалықтың толық беті
http://localhost:3000/news/[id]
```

---

## Мәселелерді шешу / Troubleshooting

### Дерекқор қателері

```bash
# Prisma client қайта генерациялау
npx prisma generate

# Миграцияларды қайта іске қосу
npx prisma migrate reset
npx prisma migrate dev
```

### API қателері

```bash
# Backend логтарын тексеру
cd server
npm run dev

# CORS қателері болса, .env файлын тексеру
CORS_ORIGIN=http://localhost:3000
```

### Frontend қателері

```bash
# Node modules қайта орнату
rm -rf node_modules
pnpm install

# Cache тазалау
rm -rf .next
pnpm dev
```

---

## Қорытынды / Summary

Жаңалықтар модулі толық функционалды және өндіріске дайын. Барлық негізгі мүмкіндіктер іске асырылған:

✅ Дерекқор схемасы  
✅ Backend API  
✅ Админ панель беттері  
✅ Пайдаланушы беттері  
✅ Вложениялар қолдауы  
✅ Responsive дизайн  
✅ Қауіпсіздік  

---

**Дамытушы:** Manus AI  
**Күні:** 2024  
**Нұсқа:** 1.0
