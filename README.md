# vector-tiles-rasterizer

a proxy server written in `fastify` for rasterizing vector tiles according to a mapbox style in real time.
the vector tiles can be served from any vector tiles backend e.g. `tegola` or `tileserver-gl`.

a quick [example](example/README.md) for additional information

----------------------------------

![badge-alerts-lgtm](https://img.shields.io/lgtm/alerts/github/MapColonies/vector-tiles-rasterizer?style=for-the-badge)

![grade-badge-lgtm](https://img.shields.io/lgtm/grade/javascript/github/MapColonies/vector-tiles-rasterizer?style=for-the-badge)

![snyk](https://img.shields.io/snyk/vulnerabilities/github/MapColonies/vector-tiles-rasterizer?style=for-the-badge)

----------------------------------

A proxy server written in `fastify` for rasterizing vector tiles in real time.
the vector tiles can be served from any vector tiles backend e.g. `tegola` or `tileserver-gl`.

## API
Checkout the OpenAPI spec [here](/openapi3.yaml)

----------------------------------

## Build and Run

On Ubuntu 20.04 Just run the following command after installation of all dependencies

# Shell
```sh
npm install
sh run.sh
```

# Docker
On any other OS build and run docker

```sh
docker build -t vector-tiles-rasterizer:latest -f Dockerfile .
```

then simply run

```sh
docker run -it \
-v /path/to/styleDir:/mnt/styles \
-e APP_STYLE_FILE_PATH=/mnt/styles/styleName.json \
verctor-tiles-rasterizer:latest
```

----------------------------------

## Test
Tests are done on a docker container,

it is possible to build the container to run only unit or integration testing by passing build-arg, by default it will run both
just add to the build command
```sh
--build-arg TESTS_TO_RUN=unit/integration
```

### integration:
test against a `tileserver-gl` serving vector-tiles
```sh
docker run --rm -it -p 80:80 -u 0 maptiler/tileserver-gl
```

```sh
docker build -f ./tests.Dockerfile --build-arg TESTS_TO_RUN=integration -t vector-tiles-rasterizer-integration:latest .
```

```sh
docker run --network host -it --name vtr-integration vector-tiles-rasterizer-integration:latest
```

### unit:
```sh
docker build -f ./tests.Dockerfile --build-arg TESTS_TO_RUN=unit -t vector-tiles-rasterizer-unit:latest .
```

```sh
docker run --network host -it --name vtr-unit vector-tiles-rasterizer-unit:latest
```
