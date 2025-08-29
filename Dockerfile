FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
# install deps (keep dev deps in case you have ts tooling; adjust later if you want --omit=dev)
RUN npm ci
# copy app
COPY . .
ENV NODE_ENV=production
EXPOSE 3000
# If your entry is dist/index.js change the line below accordingly
CMD ["node","src/index.js"]
