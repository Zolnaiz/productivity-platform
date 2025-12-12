# Questionnaire Management System

Асуулга, зардлын менежментийн цогц систем

## Онцлогууд

### Backend (NestJS + TypeORM + PostgreSQL)
- **Нэвтрэх систем**: JWT, RBAC (Super Admin, Admin, Manager, User, Viewer)
- **Байгууллагын менежмент**: Олон байгууллага дэмжих архитектур
- **Асуулгын модуль**: Олон төрлийн асуулга, онооны систем, статистик
- **Зардлын модуль**: Ангилал, статус, хавсралт файлтай зардлын менежмент
- **Тайлангийн модуль**: PDF, Excel экспорт, дэлгэрэнгүй шинжилгээ
- **Хариултын менежмент**: Хэрэглэгчийн хариултыг бүртгэх, шинжлэх

### Mobile (Flutter)
- **Крос платформ**: iOS, Android, Web дэмжих
- **Оффлайн горим**: Оффлайн ажиллагаа, синк хийх
- **Пуш мэдэгдэл**: Асуулга, зардлын мэдэгдэл
- **Хэрэглэгчийн интерфэйс**: Material Design 3

### Admin Web (React + TypeScript + Tailwind)
- **Удирдлагын самбар**: Статистик, график, KPI
- **Хэрэглэгчийн удирдлага**: Хэрэглэгч, эрх, байгууллага
- **Контент менежмент**: Асуулга, хариулт, зардал, тайлан
- **Тохиргоо**: Системийн тохиргоо, загвар

## Технологийн стек

### Backend
- **Үндсэн**: NestJS 10, TypeScript 5
- **Өгөгдлийн сан**: PostgreSQL 15, TypeORM 0.3
- **Нэвтрэх**: JWT, Passport, bcrypt
- **API**: RESTful, Swagger документаци
- **Файл**: Multer, хавсралт менежмент
- **Кэш**: Redis 7
- **Баталгаажуулалт**: class-validator, class-transformer
- **Тайлан**: PDF/Excel экспорт

### Mobile
- **Үндсэн**: Flutter 3, Dart 3
- **State Management**: Provider, Riverpod
- **API холболт**: Dio, Retrofit
- **Локал хадгалалт**: Hive, Shared Preferences
- **Зураг**: Cached Network Image
- **График**: Charts, Fl_Chart
- **Пуш мэдэгдэл**: Firebase Cloud Messaging

### Admin Web
- **Үндсэн**: React 18, TypeScript 5
- **State Management**: Context API, Zustand
- **Стиль**: Tailwind CSS 3, Material UI
- **API холболт**: Axios, React Query
- **Хэлбэр**: React Hook Form, Zod
- **Хүснэгт**: TanStack Table
- **График**: Recharts, Chart.js
- **Маршрут**: React Router 6

## Суулгац, ажиллуулалт

### Шаардлага
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15
- Redis 7
- Flutter 3+
- React 18+

### Development орчин
```bash
# 1. Хранилиг клондох
git clone <repository-url>
cd productivity-platform

# 2. Backend суулгах
cd backend
cp .env.example .env
npm install
npm run start:dev

# 3. Mobile суулгах
cd ../mobile-flutter
flutter pub get
flutter run

# 4. Admin web суулгах
cd ../admin-web
npm install
npm run dev