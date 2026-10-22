# Тестийн болон хэмжилтийн үр дүн

> `npm run results` (backend)-ээр автоматаар үүсгэв. Гараар бүү засаарай. Commit `fe9075c`, 2026-10-22T00:06:42.723Z.

## 1. Suite бүрийн нийлбэр

| Suite | Команд | Passed | Failed | Skipped | Тайлбар |
|---|---|---:|---:|---:|---|
| Backend unit + HTTP (jest) | `npx jest` | 983 | 0 | 0 |  |
| Use-case acceptance (jest + supertest + PostgreSQL) | `npx jest --config ./test/jest-uc.json --runInBand` | 44 | 0 | 0 |  |
| Web (vitest) | `cd admin-web && npx vitest run` | 1075 | 0 | 0 |  |
| Mobile (flutter test) | `cd mobile-flutter && flutter test` | 131 | 0 | 1 |  |
| Browser e2e (Playwright, demo + live API) | `cd admin-web && npx playwright test` | 39 | 0 | 0 |  |

Нийт ажилласан тест: **2272 passed**, **0 failed**.

Lint: backend — clean, web — clean.

## 2. Use case-ийн хүлээн авах тест (UC → тест → үр дүн)

Тест бүр жинхэнэ аппликейшныг (бүх модуль, guard, validation) PostgreSQL дээр HTTP API-гаар шалгана: үндсэн урсгал ба нэг өөр/татгалзсан урсгал.

| UC | Нэр | Тест файл | Тест | Үр дүн |
|---|---|---|---|---|
| UC-01 | Оноосон ажлаа гүйцэтгэх | `backend/test/use-cases/use-cases.uc-spec.ts` | ✓ main: the assignee moves their task to done and its completion is recorded<br>✓ refused: an employee cannot change somebody else’s task | pass |
| UC-02 | Өдрийн ажлын бүртгэл хөтлөх | `backend/test/use-cases/use-cases.uc-spec.ts` | ✓ main: a daily log with hours is saved and read back<br>✓ alternative: a log without a summary is refused as invalid | pass |
| UC-03 | Долоо хоногийн тайлан бичих | `backend/test/use-cases/use-cases.uc-spec.ts` | ✓ main: the employee saves this week’s check-in and reads it back<br>✓ refused: an employee cannot read the team’s check-ins | pass |
| UC-04 | Сарын тайлангаа өөрийн бүртгэлээс бэлтгэх | `backend/test/use-cases/use-cases.uc-spec.ts` | ✓ main: the monthly report counts the employee’s own logs and measurements<br>✓ refused: an employee cannot draft the team’s monthly summary | pass |
| UC-05 | Улаан шошгоор дутагдал бүртгэх | `backend/test/use-cases/use-cases.uc-spec.ts` | ✓ main: a red tag on a zone is recorded with a follow-up task<br>✓ alternative: a red tag on a zone that does not exist is refused | pass |
| UC-06 | Сайжруулалтын санаа гаргах | `backend/test/use-cases/use-cases.uc-spec.ts` | ✓ main: the idea is saved as submitted<br>✓ alternative: an idea with a too-short title is refused | pass |
| UC-07 | Хувийн бүртгэлээ удирдах | `backend/test/use-cases/use-cases.uc-spec.ts` | ✓ main: edit own phone, change password with the current one, sign in with the new one<br>✓ refused: a wrong current password, and a forgot-password answer that reveals nothing | pass |
| UC-08 | 5S аудит хийх | `backend/test/use-cases/use-cases.uc-spec.ts` | ✓ main: an audit on a zone is scored; a follow-up task is created and assigned<br>✓ refused: an audit against a template that does not exist | pass |
| UC-09 | Төсөл үүсгэж, ажил оноож хянах | `backend/test/use-cases/use-cases.uc-spec.ts` | ✓ main: the manager creates a project and a task; the assignee is notified<br>✓ refused: an employee cannot create a project | pass |
| UC-10 | Сарын төлөвлөгөө гаргах | `backend/test/use-cases/use-cases.uc-spec.ts` | ✓ main: tasks are planned for next month with owners and dates<br>✓ refused: an employee cannot plan work for others | pass |
| UC-11 | Өглөөний хурал хөтлөх | `backend/test/use-cases/use-cases.uc-spec.ts` | ✓ main: the manager reads the team’s week and open work for the huddle board<br>✓ alternative: a week that is not a date is refused | pass |
| UC-12 | Gemba явалт хийх | `backend/test/use-cases/use-cases.uc-spec.ts` | ✓ main: a walk is recorded and its follow-up becomes a task for the named person<br>✓ refused: an employee cannot record a gemba walk | pass |
| UC-13 | Санааг хянаж шийдвэрлэх | `backend/test/use-cases/use-cases.uc-spec.ts` | ✓ main: approving an idea creates the task to put it in place<br>✓ refused: an employee cannot decide on ideas | pass |
| UC-14 | Багийн бүтээмжийг дүгнэх | `backend/test/use-cases/use-cases.uc-spec.ts` | ✓ main: the manager sees the team’s month with K1–K6 and per-person rows<br>✓ alternative: an employee sees only their own figures, not the team’s | pass |
| UC-15 | Хагас жил, жилийн тайлан гаргах | `backend/test/use-cases/use-cases.uc-spec.ts` | ✓ main: the manager gets a period report spanning several months<br>✓ alternative: a range that ends before it starts is refused | pass |
| UC-16 | Сарын тайланг хааж батлах | `backend/test/use-cases/use-cases.uc-spec.ts` | ✓ main: the manager closes last month and it appears among the closed months<br>✓ refused: the running month cannot be closed, and the AI draft says it is not configured | pass |
| UC-17 | Хэрэглэгч урьж, эрх олгох | `backend/test/use-cases/use-cases.uc-spec.ts` | ✓ main: the owner invites one person and previews a spreadsheet import<br>✓ refused: an employee cannot invite anybody | pass |
| UC-18 | Хэлтэс, байгууллагын тохиргоо хийх | `backend/test/use-cases/use-cases.uc-spec.ts` | ✓ main: the owner adds a department and edits the organization<br>✓ refused: an employee cannot change the organization’s structure | pass |
| UC-19 | 5S талбай, стандарт тохируулах | `backend/test/use-cases/use-cases.uc-spec.ts` | ✓ main: the owner adds an area with its size and standard to the plan<br>✓ refused: an employee cannot create a 5S plan | pass |
| UC-20 | Аудитын шалгах хуудас боловсруулах | `backend/test/use-cases/use-cases.uc-spec.ts` | ✓ main: the owner creates a checklist template and it is listed<br>✓ refused: an employee cannot create a checklist | pass |
| UC-21 | Үйл ажиллагааны түүх шалгах | `backend/test/use-cases/use-cases.uc-spec.ts` | ✓ main: the owner reads the audit log of what was changed<br>✓ refused: a manager or employee cannot read it | pass |
| UC-22 | Сануулга илгээх, аудит товлох | `backend/test/use-cases/use-cases.uc-spec.ts` | ✓ main: the morning run tells the employee what is due today, once<br>✓ alternative: an evening run sends nothing | pass |

**22 / 22** use case бүх тестээ давсан.

## 3. Гүйцэтгэлийн хэмжилт (benchmark)

Хэмжсэн: 2026-10-21T23:47:34.400Z. Машин: Intel(R) Xeon(R) Processor @ 2.10GHz, 4 цөм, 16 GB RAM, Linux 6.18.44-fc-v139, Node v22.22.0, PostgreSQL (local, same machine).

Өгөгдөл: 50 хэрэглэгч, 10000 бүртгэл (ажил 4000, ажлын бүртгэл 4000, аудит 2000), 20 талбай.

Арга: 20 warm-up requests, then 200 sequential requests per endpoint over HTTP on 127.0.0.1 (keep-alive fetch); client and server on one machine.

| Endpoint | n | p50 (мс) | p95 (мс) | дундаж | max | NFR-06 (< 2000 мс) |
|---|---:|---:|---:|---:|---:|---|
| POST /auth/login | 200 | 70.95 | 76.77 | 71.29 | 107.59 | хангасан (p95) |
| GET /tasks (manager, whole organization) | 200 | 140.88 | 182.19 | 145.16 | 284.12 | хангасан (p95) |
| POST /work-logs/daily | 200 | 5.44 | 8.21 | 5.8 | 20.87 | хангасан (p95) |
| POST /audit-runs (submit) | 200 | 15.27 | 19.19 | 15.48 | 23.12 | хангасан (p95) |
| GET /operations/monthly-report (manager, K1–K6) | 200 | 146.87 | 184.78 | 148.77 | 211.83 | хангасан (p95) |
| Report CSV (report fetch + CSV serialisation) | 200 | 152.15 | 196.85 | 156.11 | 230.27 | хангасан (p95) |

### Алгоритмын гүйцэтгэх хугацаа (процесс дотор, 50 давталт)

| Алгоритм | p50 (мс) | p95 (мс) | max |
|---|---:|---:|---:|
| K1 + K3 (monthlyMeasurements), 10,000 records | 15.24 | 18.57 | 19.26 |
| Audit score (scoreAnswers), 10,000 audits × 10 questions | 1.46 | 2.41 | 2.91 |

### Засварын өмнө ба дараа

Эхний хэмжилтээр `dayIn()` дуудлага бүрт шинэ `Intl.DateTimeFormat` үүсгэж байсан нь сарын тайлангийн ихэнх хугацааг эзэлж байв (p95 ≈ 1.75 с, max > 2 с — NFR-06-д ойр/давсан). Formatter-ийг цагийн бүсээр кэшилсний дараа ижил өгөгдөл дээр дахин хэмжив.

| Хэмжилт | p95 өмнө (мс) | p95 дараа (мс) | max өмнө | max дараа |
|---|---:|---:|---:|---:|
| POST /auth/login | 72.58 | 76.77 | 91.59 | 107.59 |
| GET /tasks (manager, whole organization) | 160.04 | 182.19 | 219.78 | 284.12 |
| POST /work-logs/daily | 7.68 | 8.21 | 18.97 | 20.87 |
| POST /audit-runs (submit) | 18.47 | 19.19 | 22.33 | 23.12 |
| GET /operations/monthly-report (manager, K1–K6) | 1753.36 | 184.78 | 2304.22 | 211.83 |
| Report CSV (report fetch + CSV serialisation) | 1853.97 | 196.85 | 2115.53 | 230.27 |
| K1 + K3 (monthlyMeasurements), 10,000 records | 1278.2 | 18.57 | 1311.73 | 19.26 |
| Audit score (scoreAnswers), 10,000 audits × 10 questions | 2.35 | 2.41 | 4.98 | 2.91 |

### Офлайн outbox-ийн дахин илгээлт (Flutter)

`mobile-flutter/test/outbox_test.dart`: 8/8 passed.

- ✓ keeps an audit walked with no signal, and sends it when the signal is back
- ✓ survives the app being closed
- ✓ sends in the order the changes were made, and stops while still offline
- ✓ drops a change the server refuses, and says so once
- ✓ keeps a day written up offline on today’s list, hours counted
- ✓ project and task links survive an offline write, restart and replay
- ✓ without an outbox, an offline change fails as before
- ✓ says what is waiting on every tab, and sends it on request

## 4. ISO/IEC 25010 — тестийн хураангуй

| Шинж чанар | Юугаар шалгасан | Үр дүн |
|---|---|---|
| Үйл ажиллагааны тохирох байдал | 22 UC-ийн хүлээн авах тест; K1–K6-ийн хүснэгтэн unit тест | 22/22 UC pass |
| Гүйцэтгэлийн үр ашиг | 6 endpoint-ийн p50/p95, 10k бүртгэл дээрх алгоритм | хамгийн удаан p95 = 196.85 мс (NFR-06 босго 2000 мс) |
| Аюулгүй байдал | Эрхийн матриц (доор); нууц үг сэргээлтийн халдлагын тохиолдол | 15/15 татгалзах тест pass; сэргээлт: 13/13 pass |
| Ашиглахад хялбар байдал | SUS асуулга бодит хэрэглэгч шаарддаг | Хэмжээгүй (не измерено) — пилот дээр SUS авах шаардлагатай; хүртээмжийн автомат шалгалт (axe, Flutter accessibility) suite-д багтсан |
| Найдвартай байдал | Офлайн outbox, дахин илгээлт | 8/8 pass; бодит сүлжээний тасалдлын туршилт хэмжээгүй |
| Засвар үйлчилгээ | Тестийн тоо, lint | 2272 тест; lint backend clean, web clean |
| Нийцтэй байдал | Web (Chromium e2e), Android/iOS Flutter client, нэг API | e2e 39 passed, 0 failed; бусад хөтөч, бодит төхөөрөмж дээр хэмжээгүй |

### Эрхийн матриц (UC тестийн татгалзсан урсгалаас)

| Тест | Үр дүн |
|---|---|
| UC-01 Оноосон ажлаа гүйцэтгэх (complete an assigned task) › refused: an employee cannot change somebody else’s task | refused as expected |
| UC-03 Долоо хоногийн тайлан бичих (write the weekly check-in) › refused: an employee cannot read the team’s check-ins | refused as expected |
| UC-04 Сарын тайлангаа өөрийн бүртгэлээс бэлтгэх (prepare own monthly report) › refused: an employee cannot draft the team’s monthly summary | refused as expected |
| UC-07 Хувийн бүртгэлээ удирдах (manage own account) › refused: a wrong current password, and a forgot-password answer that reveals nothing | refused as expected |
| UC-08 5S аудит хийх (run a 5S audit) «include» create and notify a task › refused: an audit against a template that does not exist | refused as expected |
| UC-09 Төсөл үүсгэж, ажил оноож хянах (create a project, assign and track) «include» notify › refused: an employee cannot create a project | refused as expected |
| UC-10 Сарын төлөвлөгөө гаргах (plan the month) › refused: an employee cannot plan work for others | refused as expected |
| UC-12 Gemba явалт хийх (gemba walk) «include» create and notify tasks › refused: an employee cannot record a gemba walk | refused as expected |
| UC-13 Санааг хянаж шийдвэрлэх (review an idea) «include» create and notify a task › refused: an employee cannot decide on ideas | refused as expected |
| UC-16 Сарын тайланг хааж батлах (close the monthly report) «extend» AI draft › refused: the running month cannot be closed, and the AI draft says it is not configured | refused as expected |
| UC-17 Хэрэглэгч урьж, эрх олгох (invite users and grant roles) › refused: an employee cannot invite anybody | refused as expected |
| UC-18 Хэлтэс, байгууллагын тохиргоо хийх (departments and organization settings) › refused: an employee cannot change the organization’s structure | refused as expected |
| UC-19 5S талбай, стандарт тохируулах (set up 5S areas and standards) › refused: an employee cannot create a 5S plan | refused as expected |
| UC-20 Аудитын шалгах хуудас боловсруулах (build an audit checklist) › refused: an employee cannot create a checklist | refused as expected |
| UC-21 Үйл ажиллагааны түүх шалгах (inspect the activity history) › refused: a manager or employee cannot read it | refused as expected |

### Нууц үг сэргээлтийн халдлагын тохиолдол

- ✓ emails a link and stores only the hash of the token
- ✓ answers identically for an unknown, an inactive and a known address (no enumeration)
- ✓ sets the new password with a valid token
- ✓ refuses a token a second time (single use)
- ✓ refuses a wrong token
- ✓ refuses an expired token with the same answer as a wrong one
- ✓ refuses a token for a deactivated account
- ✓ does not mail twice inside the cooldown, and a new request replaces the old token
- ✓ rejects a short new password and a malformed address before touching anything
- ✓ lets only one of two concurrent requests with the same token succeed
- ✓ answers before the mail is sent (no timing difference from SMTP)
- ✓ rate-limits forgot-password per client
- ✓ sends the Mongolian template by default and the English one for an English user

