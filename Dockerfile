FROM node:18

WORKDIR /app

COPY package.json ./
RUN npm install

COPY properties/application.properties ./properties/

COPY . .

EXPOSE 1111
CMD ["npm", "start"]
