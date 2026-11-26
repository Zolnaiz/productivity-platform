# Баримт бичгийн газрын зураг

Төсөлд шинээр орж ирсэн хүн эндээс эхэлнэ. Файл бүр юунд хэрэгтэй, хэзээ уншихыг доор бичив.

## Унших дараалал

1. [../README.md](../README.md) — систем юу хийдэг, хавтасны бүтэц, хэрхэн ажиллуулах.
2. [ARCHITECTURE.md](ARCHITECTURE.md) — хэсгүүд, хүсэлт хэрхэн дамждаг, гол алгоритмууд, тестийн түвшин.
3. [STATUS.md](STATUS.md) — одоо хаана явж байна, юу дутуу, цаашдын ажил хувиар.
4. [DECISIONS.md](DECISIONS.md) — яагаад ингэж хийсэн бэ: шийдвэр бүр шалтгаан, хориглосон хувилбартайгаа.

Код дотор: `backend/src`, `admin-web/src`, `mobile-flutter/lib`, тест бүрийн файл эхэндээ «энэ юу хийдэг,
юутай холбогддог» тайлбартай. ARCHITECTURE.md нь тэдгээрийг холбосон зураг.

## Идэвхтэй баримтууд

| Файл | Агуулга | Хэзээ шинэчлэх |
|---|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Бүтэц, хүсэлтийн урсгал, алгоритм, хуваарьт ажил | Модуль, алгоритм, cron нэмэхэд |
| [STATUS.md](STATUS.md) | Төлөв, хувь, цаашдын ажил, үзлэгийн шаардлага | Ажил дуусах бүрт |
| [PLAN_V2.md](PLAN_V2.md) | v1.0-ийн 14 модулийн тодорхойлолт, үе шат | Шинэ шийдвэр гарахад |
| [DECISIONS.md](DECISIONS.md) | Зохиомжийн шийдвэрүүд | Шийдвэр гаргах бүрт (хуучныг устгахгүй) |
| [RESULTS.md](RESULTS.md) | Тест, гүйцэтгэлийн үр дүн | Гараар засахгүй: `cd backend && npm run results` |
| [measurements.md](measurements.md) | K1–K7-ийн тодорхойлолт, томьёо | Хэмжүүрийн дүрэм өөрчлөгдөхөд |
| [UI_GUIDELINES.md](UI_GUIDELINES.md) | Вэбийн загвар, өнгө, хандалтын дүрэм | Шинэ бүрэлдэхүүн нэмэхэд |
| [BACKEND_DEV_SETUP.md](BACKEND_DEV_SETUP.md) | Хөгжүүлэлтийн орчин (PostgreSQL, .env, migration) | Орчин өөрчлөгдөхөд |
| [VERIFY.md](VERIFY.md) | Өөрчлөлтийг шалгах дараалал, тусгаарласан live шалгалт | Шалгах алхам нэмэгдэхэд |
| [DEPLOY.md](DEPLOY.md) | Production-д гаргах товч заавар | Deploy өөрчлөгдөхөд |
| [DEPLOYMENT_RUN.md](DEPLOYMENT_RUN.md) | Deploy-ийн алхам бүр, бодит гаралт, гарсан алдаа | Шинэ deploy хийхэд |
| [POSTGRES_BACKUP_RESTORE.md](POSTGRES_BACKUP_RESTORE.md) | Нөөцлөх, сэргээх, сэргээх дадлагын тэмдэглэл | Сэргээх дадлага бүрийн дараа |
| [diploma/README.md](diploma/README.md) | Дипломын бичвэр, зураг, илтгэл, үзлэгийн хуваарь | Үзлэг бүрийн өмнө |
| [../mobile-flutter/README.md](../mobile-flutter/README.md) | Гар утасны апп ажиллуулах, APK гаргах | Утасны тохиргоо өөрчлөгдөхөд |
| [../backend/README.md](../backend/README.md) | API-ийн командууд | Команд нэмэгдэхэд |

## Архив

[archive/](archive/) — хуучирсан төлөвлөгөө, тайлан. Түүх болгон хадгалсан; одоогийн төлөв STATUS.md, PLAN_V2.md-д.

| Файл | Юугаар солигдсон |
|---|---|
| archive/PRODUCT_BLUEPRINT.md (2026-06) | ARCHITECTURE.md, PLAN_V2.md |
| archive/PRODUCT_EXECUTION_PLAN.md (2026-10) | STATUS.md |
| archive/PRODUCT_AUDIT_REPORT_2026-09-29.md | STATUS.md (дутагдлууд засагдсан) |
| archive/ROADMAP.md (2026-10) | STATUS.md §3; дэлгэрэнгүй backlog-ийн зүйлсийг STATUS эндээс иш татдаг |
| archive/WORKLOG.md (2026-10) | git түүх, STATUS.md |

## Дүрэм

- Тоо гараар бичихгүй: тест, хэмжилтийн тоо RESULTS.md-ээс, хүснэгт, migration-ийн тоо кодоос.
- Нэг зүйлийг нэг л газар бичнэ; бусад нь холбоосоор заана.
- Хуучирсан баримтыг устгахгүй, `archive/`-д шилжүүлж энэ хүснэгтэд бичнэ.
