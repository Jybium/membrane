FROM node:24-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

#####################################
FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app


COPY --from=build /app/dist ./dist
COPY package*.json ./


EXPOSE 3000
CMD ["node", "dist/main.js"]