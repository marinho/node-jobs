FROM node:14

# Create app directory
WORKDIR /var/www/node-jobs

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN apt update && apt install -y mongodb-clients
RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

RUN mkdir -p /etc/node.jobs/
COPY docker-conf.json /etc/node.jobs/conf.json

EXPOSE 3000

CMD [ "npm", "start" ]
