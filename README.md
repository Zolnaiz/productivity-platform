# 🚀 Продактивити Платформ

Бүрэн функциональ бүхий продактивити платформ - судалгаа, зардал, тайлангийн систем.

## 🏗️ Бүтэц

Проект нь 3 үндсэн хэсгээс бүрдэнэ:

1. **📱 Mobile App (Flutter)** - Хэрэглэгчийн гар утасны апп
2. **⚙️ Backend API (NestJS)** - REST API сервер
3. **🖥️ Admin Web (React + TypeScript)** - Админ панел

## 🚀 Суулгах заавар

### Өмнөх шаардлага

- Node.js 18+ 
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+
- Flutter 3.0+ (зөвхөн mobile хөгжүүлэлтийн хувьд)

### Docker ашиглан суулгах (Тохиромжтой арга)

```bash
# 1. Репозитори клондох
git clone https://github.com/your-org/productivity-platform.git
cd productivity-platform

# 2. Environment файл бэлтгэх
cp .env.example .env
# .env файлыг тохируулна уу

# 3. Docker Compose ажиллуулах
docker-compose up -d

# 4. Хэрэглэх боломжтой сервисүүд:
# - Backend API: http://localhost:3000
# - Admin Web: http://localhost:3001
# - PostgreSQL: localhost:5432
# - PGAdmin: http://localhost:5050
# - Redis: localhost:6379