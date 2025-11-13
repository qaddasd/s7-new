## Диагностика
- Курсы: дублированный обработчик `GET /courses/:courseId/lessons/:lessonId` возвращает разные форматы. Первый вернёт `{ lesson, questions }` (server/src/routes/courses.ts:26–93), второй — плоский объект урока (server/src/routes/courses.ts:648–702). UI ожидает плоский формат и не читает `data.lesson.videoUrl`, поэтому видео/слайды не устанавливаются.
- Тост на 100 XP: сервер начисляет XP и отправляет сертификат на почту при пересечении порога (server/src/routes/courses.ts:296–333), но клиент не делает рефреш профиля и не показывает тост по событию; тостовая инфраструктура есть (hooks/use-toast.ts), вызов нужно добавить.
- Bytesize: публичный список доступен по `/bytesize` (server/src/routes/bytesize.ts:26–60). В dev-конфиге Next отсутствует проксирование `/bytesize`, поэтому `apiFetch("/bytesize")` получает 404 и список пуст (next.config.mjs:12–22).

## План исправлений
1) Курсы: единый формат для `GET /courses/:courseId/lessons/:lessonId`
- Удалить ранний дублирующий маршрут и оставить один, который возвращает плоский объект урока с нормализованными медиа (server/src/routes/courses.ts:26–93).
- Проверить, что `toApiMedia(...)` применяется для `videoUrl/presentationUrl/slides` (server/src/routes/courses.ts:680–689).
- В UI при загрузке урока оставить существующую логику (components/tabs/course-lesson-tab.tsx:169–184), которая ожидает плоские поля `data.videoUrl`, `data.slides`.

2) Тост при достижении 100 XP
- В `answerLessonQuestion(...)` после успешного правильного ответа (components/tabs/course-lesson-tab.tsx:216–233) вызвать `GET /auth/me`, сравнить прошлый XP и новый. Если порог пересечён (до <100, после ≥100), показать тост: `"Вы успешно достигли 100 очков в этом курсе. На вашу почту отправлен бонус."`.
- Альтернатива/дополнение: добавить флаг `thresholdCrossed` в ответ сервера `POST /courses/questions/:questionId/answer` (server/src/routes/courses.ts:270–340) и использовать его для показа тоста; но клиентский рефреш `/auth/me` всё равно нужен, чтобы обновить `user.xp` в UI.

3) Bytesize список в dev
- Добавить rewrite для `/bytesize/:path*` в Next (next.config.mjs:12–22): `{ source: '/bytesize/:path*', destination: `${target}/bytesize/:path*` }`.
- Проверить, что URL нормализуются: сервер отдаёт `/media/...` (server/src/routes/bytesize.ts:49–50), клиент конвертирует в `/api/media/...` (components/tabs/bytesize-tab.tsx:19–38).

## Проверки после изменений
- Курсы: открыть урок с прикреплённым видео, убедиться, что `<video src>` указывает на `.../api/media/...` и воспроизводит (components/tabs/course-lesson-tab.tsx:270–279).
- XP‑тост: ответить на вопросы до достижения 100 XP; увидеть тост и проверить, что `user.xp` обновился в профиле (components/tabs/profile-tab.tsx:102, 163). Письмо с сертификатом приходит (server/src/utils/email.ts:120–212).
- Bytesize: загрузить видео в админке, затем открыть вкладку Bytesize; список не пуст, видео автопроигрывается (components/tabs/bytesize-tab.tsx:63–99, 149–159).

## Примечания по рискам
- Дубликат маршрута курсов может скрывать зависимости; после удаления убедиться, что список вопросов берётся через `GET /courses/:courseId/questions?lessonId=...` (server/src/routes/courses.ts:206–268), как уже делает UI (components/tabs/course-lesson-tab.tsx:192–214).
- Если окружение продакшена проксирует `/bytesize`, изменение в Next нужно только для локальной разработки. В проде изменений nginx не требуется.

Готов внести правки и провести проверку. Подтвердите план, чтобы продолжить.