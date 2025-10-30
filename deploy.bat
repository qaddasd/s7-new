@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM ====== НАСТРОЙКИ ======
set "HOST=64.188.64.241"
set "USER=root"

REM Путь проекта на сервере
set "APP_DIR=/var/www/s7"
set "BE_DIR=/var/www/s7/server"

REM Ветка (если нужно)
set "BRANCH=main"

REM PM2 имена процессов
set "PM2_BACKEND=s7-backend"
set "PM2_FRONTEND=s7-frontend"

REM Prisma: выполнять ли db push/generate
set "DO_DB_PUSH=1"

REM Prisma: дропнуть таблицу ByteSizeLike перед пушем (быстрый безопасный путь)
set "DROP_LIKES=1"

REM (опц.) путь до SSH-ключа в Windows. Если стандартный — оставьте закомментированным.
REM set "SSH_KEY=%USERPROFILE%\.ssh\id_rsa"

REM ====== SSH КОМАНДА ======
set "SSH=ssh %USER%@%HOST%"
if defined SSH_KEY set "SSH=ssh -i "%SSH_KEY%" %USER%@%HOST%"

echo === Deploy to %USER%@%HOST% ===

%SSH% "bash -lc '
  set -e

  echo \"[Check] git/node/npm/pm2/curl\"
  command -v git  >/dev/null || { echo git not installed; exit 1; }
  command -v node >/dev/null || { echo node not installed; exit 1; }
  command -v npm  >/dev/null || { echo npm not installed; exit 1; }
  command -v pm2  >/dev/null || npm i -g pm2
  command -v curl >/dev/null || true

  echo
  echo \"[Git] Stash + Pull\"
  cd %APP_DIR%
  git status || true
  git stash --include-untracked || true
  git fetch --all --prune || true
  git checkout %BRANCH% || true
  git pull --rebase

  echo
  echo \"[Frontend] Clean install and build\"
  cd %APP_DIR%
  rm -rf node_modules .next || true
  if [ -f package-lock.json ]; then
    npm ci || npm i
  else
    npm i
  fi
  npm run build || true

  if [ \"%DO_DB_PUSH%\" = \"1\" ]; then
    echo
    echo \"[Prisma] DB prepare\"
    cd %APP_DIR%
    if [ \"%DROP_LIKES%\" = \"1\" ]; then
      echo \"- drop ByteSizeLike\"
      printf \"DROP TABLE IF EXISTS \\\"ByteSizeLike\\\" CASCADE;\\n\" | npx prisma db execute --schema ./prisma/schema.prisma --stdin
    fi
    echo \"- db push\"
    npx prisma db push --schema ./prisma/schema.prisma --accept-data-loss
    echo \"- prisma generate\"
    npx prisma generate --schema ./prisma/schema.prisma
  fi

  echo
  echo \"[Backend] Install and build\"
  cd %BE_DIR%
  if [ -f package-lock.json ]; then
    npm ci || npm i
  else
    npm i
  fi
  npm run build

  echo