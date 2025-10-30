# GitHub-қа Push жасау нұсқаулары

## Дайын файлдар

Келесі файлдар git-ке қосылды және commit жасауға дайын:

### Жаңа файлдар:
- ✅ `app/admin/news/page.tsx` - Админ жаңалықтар тізімі
- ✅ `app/admin/news/new/page.tsx` - Жаңа жаңалық қосу
- ✅ `app/admin/news/[id]/page.tsx` - Жаңалықты редакциялау
- ✅ `app/news/page.tsx` - Пайдаланушы жаңалықтар тізімі
- ✅ `app/news/[id]/page.tsx` - Жаңалықтың толық беті
- ✅ `server/src/routes/news.ts` - News API маршруттары
- ✅ `create-admin.js` - Admin құру скрипті
- ✅ `verify-admin.js` - Email верификация скрипті
- ✅ `NEWS_MODULE_SETUP.md` - Толық орнату нұсқаулығы
- ✅ `NEWS_MODULE_SUMMARY.md` - Қысқаша қорытынды
- ✅ `NEWS_FILES_CREATED.txt` - Файлдар тізімі
- ✅ `DEPLOY_TO_VPS.md` - VPS deploy нұсқаулығы

### Өзгертілген файлдар:
- ✅ `prisma/schema.prisma` - News және NewsAttachment модельдері
- ✅ `components/admin/admin-sidebar.tsx` - "Новости" пункті
- ✅ `server/src/index.ts` - News router қосылды

---

## Қадам 1: Commit жасау

```bash
cd /home/ubuntu/s7-platform

git commit -m "feat: Add News module with admin panel and public pages

- Added News and NewsAttachment models to Prisma schema
- Created admin panel pages for news management (list, create, edit)
- Created public pages for news display
- Added News API routes with CRUD operations
- Added admin creation and email verification scripts
- Added comprehensive documentation (setup, deployment, summary)
- Updated admin sidebar with News menu item

Features:
- Create, edit, delete news
- Publish/unpublish functionality
- Support for attachments (photo, video, presentation, document, link)
- Responsive design
- Pagination
- Admin-only access control"
```

---

## Қадам 2: GitHub-қа Push жасау

### Опция А: HTTPS арқылы (Personal Access Token)

```bash
git push origin main
```

**Егер authentication сұраса:**
1. GitHub-та Personal Access Token жасаңыз:
   - Settings → Developer settings → Personal access tokens → Tokens (classic)
   - "Generate new token" → repo қосыңыз
   
2. Username: `qaddasd`
3. Password: `ваш_personal_access_token`

### Опция Б: SSH арқылы (ұсынылады)

**SSH key жасау (егер жоқ болса):**
```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
cat ~/.ssh/id_ed25519.pub
```

**GitHub-қа SSH key қосу:**
1. Көрсетілген public key-ді көшіріңіз
2. GitHub → Settings → SSH and GPG keys → New SSH key
3. Key-ді қосыңыз

**Remote URL-ді SSH-ға өзгерту:**
```bash
git remote set-url origin git@github.com:qaddasd/s7-platform.git
git push origin main
```

---

## Қадам 3: Push тексеру

```bash
# Push сәтті болғанын тексеру
git log --oneline -1

# GitHub-та тексеру
# https://github.com/qaddasd/s7-platform
```

---

## Қадам 4: VPS-қа deploy жасау

Push сәтті болғаннан кейін, VPS-та:

```bash
# VPS-қа қосылу
ssh your-user@your-vps-ip

# Жобаға өту
cd /var/www/s7-platform

# Өзгерістерді тарту
git pull origin main

# Тәуелділіктерді орнату
npm install
cd server && npm install && cd ..

# Дерекқорды жаңарту
npx prisma generate
npx prisma db push

# Admin құру (егер жоқ болса)
node create-admin.js
node verify-admin.js

# Production build
npm run build

# Серверлерді қайта іске қосу
pm2 restart all
```

Толық нұсқау: `DEPLOY_TO_VPS.md`

---

## Ескертулер

### Қосылмайтын файлдар (игнорланады):
- `prisma/dev.db` - дерекқор файлы
- `.env` файлдар - құпия деректер
- `node_modules/` - тәуелділіктер
- `.next/` - build файлдары

### Қауіпсіздік:
- ⚠️ `.env` файлдарын ЕШҚАШАН commit жасамаңыз
- ⚠️ `prisma/dev.db` файлын commit жасамаңыз
- ⚠️ Құпия кілттерді GitHub-қа жүктемеңіз

---

## Көмек

### Қателер болса:

**"Permission denied" қатесі:**
```bash
# SSH key қосыңыз немесе HTTPS + token қолданыңыз
```

**"Conflict" қатесі:**
```bash
git pull origin main --rebase
git push origin main
```

**Өзгерістерді болдырмау:**
```bash
git reset --soft HEAD~1  # соңғы commit-ті болдырмау
git reset --hard HEAD~1  # соңғы commit пен өзгерістерді жою
```

---

## Қорытынды

Барлық дайын! Commit жасап, push жасаңыз:

```bash
cd /home/ubuntu/s7-platform
git commit -m "feat: Add News module with admin panel and public pages"
git push origin main
```

Сәттілік! 🚀
