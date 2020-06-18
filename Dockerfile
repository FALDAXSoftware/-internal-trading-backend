FROM 100.69.158.196/buildtool:pm291
WORKDIR /usr/share/nginx/html/internal-trading
COPY ./src/package*.json ./
COPY .env .env
RUN npm install
COPY ./src/ .
RUN npm run migrate
CMD [ "pm2-runtime", "start", "app.js" ]