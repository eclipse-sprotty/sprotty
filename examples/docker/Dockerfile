# This file configures a docker container which serves the example pages of sprotty

FROM openjdk:8-jdk

### Install NodeJS
USER root

RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get install -y nodejs
RUN echo "node version:" && node --version

### Install Yarn
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update && apt-get install -y yarn
RUN echo "yarn version:" && yarn --version

### Clone the sprotty repository with user 'sprotty'
RUN useradd -m sprotty
USER sprotty
WORKDIR /home/sprotty

RUN git clone -b docker https://github.com/theia-ide/sprotty.git

### Build the client
RUN cd sprotty/client && yarn && yarn run examples:build

### Build the server
RUN cd sprotty/server && ./gradlew build --no-daemon

### Run the Jetty server on startup
EXPOSE 8080
CMD cd sprotty/server && ./gradlew jettyRun --no-daemon
