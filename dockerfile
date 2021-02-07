FROM "node"

WORKDIR /opt/app

COPY package*.json index.js routes.json driverinfo.js ./

RUN npm install --production

CMD [ "node", "index.js" ]