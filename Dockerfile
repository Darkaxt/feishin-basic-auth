# --- Builder stage
FROM node:23-alpine as builder
WORKDIR /app

# Copy package.json first to cache node_modules
COPY package.json pnpm-lock.yaml .

RUN npm install -g pnpm

RUN pnpm install

# Copy code and build with cached modules
COPY . .
RUN pnpm run build:web

# --- Production stage
FROM nginx:alpine-slim

COPY --chown=nginx:nginx --from=builder /app/out/web /usr/share/nginx/html
COPY ./settings.js.template /etc/nginx/templates/settings.js.template
COPY ./ng.conf.template /etc/nginx/templates/default.conf.template
COPY ./docker-entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh

ENV PUBLIC_PATH="/"
ENV LEGACY_AUTHENTICATION="false"
ENV ANALYTICS_DISABLED="false"

EXPOSE 9180
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
