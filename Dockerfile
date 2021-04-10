FROM node:14

RUN apt-get update && apt-get install

WORKDIR /parse-xbrl

COPY . /parse-xbrl

RUN npm ci


CMD ["node","-v"]