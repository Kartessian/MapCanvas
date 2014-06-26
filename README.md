MapCanvas
=========

This folder contains the core drawing functionallity of [Kartessian](http://www.kartessian.com) using [Mapbox](http://www.mapbox.com).

Please note that this repository is intended as an example of Kartessian methods and techniques and how they are being used in the project, not the original source code (not yet).

There is no need of third party libraries except for [Mapbox.js](https://github.com/mapbox/mapbox.js/). Don't forget to get your [Map ID](https://www.mapbox.com/developers/) before start using the Mapbox service.

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

    layerCanvas.draw();
}

```

### Extensions

In the lCanvas.js file is defined only the plain point type. You can extend the type of points by including the lCanvas.dotType.[typeName].js files available here or creating your own ones.

If you use the current version of lCanvas.js you will need to update the code to include the new types:

```js

  switch (this._pointType) {
        case 'simple':
            this.drawSimpleDot(hiddenCanvas, mapbounds, map, sw, ne);
            break;
        case 'heatmap':
            this.drawSimpleHeat(hiddenCanvas, mapbounds, map, sw, ne);
            break;
  }

  // there is always the posibility to not use a switch and call directly the function, 
  // but I will let you do that part.
  // this[this._potinType](hiddenCanvas, mapbounds, map, sw, ne);

```

Once you are ready you just specify the point type you want to use, and draw() it again.

```js

    layerCanvas._pointType = 'heatmap';

    layerCanvas.draw();

```
