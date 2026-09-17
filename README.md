# Электронный дневник школы

Nuxt 3 + TypeScript + PostgreSQL. Авторизация для учителя и ученика/родителя.

## Быстрый старт

```bash
# 1. Установить зависимости
npm install

# 2. Создать БД и накатить схему
createdb school_diary
psql school_diary < db/schema.sql

# 3. Скопировать .env
cp .env.example .env

# 4. Создать тестовых пользователей
npm run user:create teacher teacher123 "Смирнова А.П."
npm run user:create student student123 "Иванов Иван" 1

# 5. Запустить дев-сервер
npm run dev
