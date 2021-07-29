# vector-tiles-rasterizer
A Helm chart for vector-tiles-rasterizer

A proxy server for rasterizing vector tiles in real time.

**Configuration**

provide mapbox styles in json format to ./helm/configurations/styles

**Values**

- `environment` - the working environment, defaults to `development`
- `cloudProvider.name` - name of the cloud provider. supports `minikube` and `azure`, defaults to `minikube`
- `cloudProvider.dockerRegistryUrl` - the docker image registry url
- `ratio` - sets the scale at which the service will render tiles, such as 2 for rendering images for high pixel density displays
- `tileSize` - the height and width of provided raster tile 256 or 512
- `minZoom` - the minimum zoom supported by the source vector-tiles
- `maxZoom` - the maximum zoom supported by the source vector-tiles
- `styleFileName` - the name of the style to be rasterized by the service. the style file needs to be located in `./helm/configurations/styles`, defaults to `style.json`
- `minPoolResources` - minimum number of rasterizers in the pool
- `maxPoolResources` - maximum number of rasterizers in the pool

**Global Values**

- `global.environment` - overrides the value on `environment`
- `global.cloudProvider.name` - overrides the value on `cloudProvider.name`
- `global.cloudProvider.dockerRegistryUrl` - overrides the value on `cloudProvider.dockerRegistryUrl`

**Installing the chart**

```
helm install -f ./helm/myvalues.yaml vector-tiles-rasterizer ./helm
```
