FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --omit=dev
ENV PORT=3002
EXPOSE 3002
CMD ["npm","start"]
