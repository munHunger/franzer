FROM justadudewhohacks/opencv-nodejs
ENV NODE_PATH /usr/lib/node_modules
ENV OPENCV4NODEJS_DISABLE_AUTOBUILD 1
WORKDIR /tmp

ADD src src
ADD data data
ADD package.json .
ADD package-lock.json .

RUN npm install

RUN ls
RUN node src/opencv.js