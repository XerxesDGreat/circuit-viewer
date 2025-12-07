FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
COPY apps/frontend/package*.json apps/frontend/
RUN npm install

COPY . .
RUN npm run build --workspace apps/frontend

FROM nginx:1.27-alpine
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

