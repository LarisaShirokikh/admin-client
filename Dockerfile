# Dockerfile с поддержкой dev и prod режимов
FROM node:20-alpine AS base

WORKDIR /app

# Копируем package files
COPY package.json yarn.lock* ./

# Устанавливаем все зависимости (включая dev)
RUN yarn install

# Копируем исходный код
COPY . .

# ===============================
# Development stage
# ===============================
FROM base AS development

# В dev режиме не собираем, запускаем yarn dev
CMD ["yarn", "dev"]

# ===============================
# Production stage
# ===============================
FROM base AS production

# Собираем приложение для продакшена
RUN yarn build

# Удаляем dev зависимости для уменьшения размера
RUN yarn install --production --frozen-lockfile

CMD ["yarn", "start"]

# ===============================
# По умолчанию production
# ===============================
FROM production