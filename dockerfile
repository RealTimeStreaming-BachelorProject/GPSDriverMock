FROM "node"

WORKDIR /opt/app

COPY package*.json index.js routes.json ./

RUN npm install --production

CMD [ "node", "index.js" ]