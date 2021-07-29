FROM ubuntu:20.04 AS tester

ARG NODE_VERSION=14.x
ARG TESTS_TO_RUN=''
ENV TESTS_TO_RUN ${TESTS_TO_RUN}
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update -yq \
    && apt-get -yq install curl gnupg ca-certificates software-properties-common dumb-init \
    && add-apt-repository ppa:kisak/kisak-mesa \
    && curl -L https://deb.nodesource.com/setup_${NODE_VERSION} | bash \
    && apt-get install -yq \
        dh-autoreconf=19 \
        nodejs

RUN apt-get -qq update \
    && apt-get -y --no-install-recommends install \
    xvfb \
    libjpeg8 \
    libuv1-dev \
    libopengl0 \
    x11-utils \
    libcurl3-gnutls \
    libegl1-mesa \
    && apt-get -y --purge autoremove \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

RUN chmod a+x /usr/src/app/docker-test.sh

CMD ["./docker-test.sh"]
