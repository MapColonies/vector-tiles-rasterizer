FROM ubuntu:20.04 AS build

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get -qq update \
    && apt-get -y --no-install-recommends install \
    apt-transport-https \
    curl \
    unzip \
    build-essential \
    python \
    libcairo2-dev \
    libgles2-mesa-dev \
    libgbm-dev \
    libllvm7 \
    libprotobuf-dev \
    && apt-get -y --purge autoremove \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN apt-get update -yq \
    && apt-get -yq install gnupg ca-certificates \
    && curl -L https://deb.nodesource.com/setup_14.x | bash \
    && apt-get install -yq \
        dh-autoreconf=19 \
        nodejs

WORKDIR /tmp/buildApp

COPY ./package*.json ./

RUN npm install
COPY . .
RUN npm run build


FROM ubuntu:20.04 AS production

ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_ENV=production
ENV SERVER_PORT=8080

RUN apt-get update -yq \
    && apt-get -yq install curl gnupg ca-certificates software-properties-common dumb-init \
    && add-apt-repository ppa:kisak/kisak-mesa \
    && curl -L https://deb.nodesource.com/setup_14.x | bash \
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

RUN npm ci --only=production

COPY --from=build /tmp/buildApp/dist .
COPY ./config ./config
COPY ./docker-entrypoint.sh .

COPY ./resources ./resources

RUN chmod 777 /usr/src/app/docker-entrypoint.sh

RUN useradd -ms /bin/bash user && usermod -a -G root user

USER user
EXPOSE 8080

CMD ./docker-entrypoint.sh
