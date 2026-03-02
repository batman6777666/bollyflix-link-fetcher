FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

COPY package*.json ./

RUN npm install --production

RUN npx playwright install chromium

COPY . .

EXPOSE 7860

ENV NODE_ENV=production
ENV PORT=7860

CMD ["node", "server.js"]
