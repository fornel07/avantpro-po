FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/

RUN npm ci -w apps/web --include-workspace-root

COPY apps/web ./apps/web

WORKDIR /app/apps/web

EXPOSE 5173

CMD ["npm", "run", "dev"]
