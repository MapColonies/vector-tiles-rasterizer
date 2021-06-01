# instructions for running the vector-tiles-rasterizer

before running the server we must provide a compatible environment,

1. serve vector-tiles, we'll use the docker image of `tileserver-gl` for simplicity

```docker
docker run --rm -it --network host -p 8080:80 -u 0 maptiler/tileserver-gl
```

the image will download mbtiles sample data of zurich and will serve the vector tiles on port 80

2. clone the repository
```sh
git clone https://github.com/MapColonies/vector-tiles-rasterizer.git

cd vector-tiles-rasterizer
```

3. in /example `map.html` which holds a simple leaflet component. configure the map component's `tileSize` and `zoomOffset` values (defaults to `tileSize` 256 and `zoomOffset` 0. to work with 512 change `tileSize` to 512 and `zoomOffset` to `-1`)

4. make sure the addresses in the `/styles/zurich-style.json` are compatible.
- `tiles`: the address under: sources.openmaptiles.tiles
- `fonts`: the address under: glyphs

5. build the `vector-tiles-rasterizer` image
```docker
docker build -f ./Dockerfile --rm -t vector-tiles-rasterizer:latest .
```

6. run the image
```docker
docker run --rm --network host -e APP_STYLE_FILE_PATH=/usr/src/app/styles/zurich-style.json -v /path/to/vector-tiles-rasterizer/example/styles:/usr/src/app/styles -it --name vtr vector-tiles-rasterizer:latest
```

`APP_STYLE_FILE_PATH` - the path to the style file
`APP_TILE_SIZE` - the tile size, 256 or 512. defaults to 256.

the `vector-tiles-rasterizer` server is up and running on port 8080

7. open `map.html` in /example to view the rasterized vector tiles.
