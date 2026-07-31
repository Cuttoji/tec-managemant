FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
ENV PORT=3002
EXPOSE 3002
CMD ["npm","start"]
