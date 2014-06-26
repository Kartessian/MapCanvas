MapCanvas
=========

This folder contains the core drawing functionallity of Kartessian using Mapbox.

Please note that this repository is intended as an example of Kartessian methods and techniques and how they are being used in the project, not the original source code (not yet).

There is no need of third party libraries except for [Mapbox.js](https://github.com/mapbox/mapbox.js/)

### Example

Include lCanvas.js after Mapbox.js

```html
<script src="scripts/mapbox.js"></script>
<script src="scripts/lCanvas.js"></script>
```

Create a div where your map to be displayed

```html
<div id="myMap" style="width:400px; height:400px"></div>
```

Initialize the map and the MapCanvas.

```js

window.onload = function() {

  var map = L.mapbox.map('myMap', 'yourMaboxKey'),
      layerCanvas = new lCanvas('canvasName');

    // add the layer to the map
    map.addLayer(layerCanvas);

    // add as many points as you want to the MapCanvas
    // this example with add one point for each lat/lng coordinate

    for (var lat = -89; lat < 90; lat++) {

        for (var lng = -179; lng < 180; lng++) {

            layerCanvas.addPoint(L.latLng(lat, lng));

        }

    }

    layerCanvas.drawn();
}

```
