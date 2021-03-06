MapCanvas
=========

This folder contains the core drawing functionallity of [Kartessian](http://www.kartessian.com) using [Mapbox](http://www.mapbox.com) and [Google Maps](https://developers.google.com/maps/web/).


There is no need of third party libraries except for [Mapbox.js](https://www.mapbox.com/mapbox.js/api/v2.0.0/). Don't forget to obtain your [Map ID](https://www.mapbox.com/developers/) and [Access Token](https://www.mapbox.com/developers/api/) before start using the Mapbox service.

Do you want to know more? Take a look at the [wiki](https://github.com/Kartessian/MapCanvas/wiki)

### Mapbox

Include [ktsn.lf.canvas.js](https://raw.githubusercontent.com/Kartessian/MapCanvas/master/ktsn.lf.canvas.js) _(23Kb &raquo; 5.5Kb [minified](https://raw.githubusercontent.com/Kartessian/MapCanvas/master/ktsn.lf.canvas.min.js))_ after Mapbox.js

```html
    <script src='https://api.tiles.mapbox.com/mapbox.js/v2.0.0/mapbox.js'></script>
    <link href='https://api.tiles.mapbox.com/mapbox.js/v2.0.0/mapbox.css' rel='stylesheet' />
    <script src="ktsn.lf.canvas.js"></script>
```

Create a div where your map to be displayed

```html
<div id="myMap" style="width:400px; height:400px"></div>
```

Initialize the map and the MapCanvas.

```js

window.onload = function() {

  L.mapbox.accessToken = 'yourAccesstoken';
  var map = L.mapbox.map('myMap', 'yourMaboxKey');

  // initialize the plugin
  K.init(map);
  
}

```

### Google Maps

Include [ktsn.gm.canvas.js](https://raw.githubusercontent.com/Kartessian/MapCanvas/master/ktsn.gm.canvas.js) _(26.7Kb &raquo; 9.7Kb [minified](https://raw.githubusercontent.com/Kartessian/MapCanvas/master/ktsn.gm.canvas.min.js))_ after the Google Maps script

```html
    <script src="//maps.googleapis.com/maps/api/js?key=[yerAPIkeyhere]&sensor=false"></script>
    <script src="ktsn.gm.canvas.js"></script>
```

Create a div where your map to be displayed

```html
<div id="myMap" style="width:400px; height:400px"></div>
```

Initialize the map and the MapCanvas.

```js

window.onload = function() {
  var mapOptions = {
    center: new google.maps.LatLng(37.72658651203338, 264.55766830232244)
    , zoom: 4
    , mapTypeId: google.maps.MapTypeId.ROADMAP
    , mapTypeControl: false
    , streetViewControl: false
    , panControl: false
    , zoomControl: false
  };

  // initialize the plugin
  K.init({ map: new google.maps.Map(document.getElementById("myMap"), mapOptions) });

}

```

### Start adding points

Once you initiated the plugin for Mapbox or Googgle Maps, the functionallity is the same for both of them.

```js

  // create a new layer
  var newLayer = new K.Layer("name", 
    { type: 'plain',
      alpha: 255, 
      fillColor: { hex: '#ff0000', r: 255, g: 0, b: 0 }, 
      borderColor: { hex: '#ff0000', r: 255, g: 0, b: 0 }, 
      pointSize: 7
    });

    // add as many points as you want to the MapCanvas
    // this example with add one point for each lat/lng coordinate

    for (var lat = -89; lat < 90; lat++) {

        for (var lng = -179; lng < 180; lng++) {
            newLayer.addPoint(new K.Point(lat, lng));
        }

    }

    // finally add the layer to the plugin
    K.addLayer(newLayer);
```

You can add and remove points from existing layers after adding it to the canvas, just reference your layer and use the addPoint and removePoints methods.

### API (in progress...)

**K**

_Methods_

**.init(options)**

Initializes the component

|Option|Type|Description|
|---|---|---|
|option|Object|Object containing the mapbox or google maps setup.|

1. Mapbox
  It can be used in two ways:
  1. { "map": referenceToMapBoxMap } _same as the example_
  2. { "token" : "yourAccessToken", "div" : "mapContainerId", "key" : "yourMapboxMapId" }

2. Google Maps
  It can be used in two ways:
  1. { "map": referenceToGoogleMapsObject } _same as the example_
  2. { "div" : "mapContainerId", "options" : { object with google maps options } }

**.addLayer(layer)**

|Option|Type|Description|
|---|---|---|
|layer|K.Layer|Add the layer to the canvas|

**.destroy()**

Destroys the layer object, removes all elements from the DOM

**.removeLayer(layerId)**

Removes the specified layer from the canvas

|Option|Type|Description|
|---|---|---|
|layerId|Number|Id of the layer to be removed|


---


**K.Layer( name, style)**

|Option|Type|Description|
|---|---|---|
|name|String|Name of the layer|
|style|Object|Style definition of the layer|

_Methods_

**.addPoint(point)**

Add a single point to the layer

|Option|Type|Description|
|---|---|---|
|point|L.Point|Point to add to the layer|

**.addRange(range)**

Add a range of points into the layer

|Option|Type|Description|
|---|---|---|
|range|Array of L.Point|Array containing points to be added to the layer|

**.set(option, value)**

Set the value of the specified property

|Option|Type|Description|
|---|---|---|
|option|String|Name of the property|
|value|Object|Value of the property|

**.set(options)**

Being the options a valid object, set the value of all the properties in the object

|Option|Type|Description|
|---|---|---|
|options|Object|Object to use to set the properties based on it's attributes|


---


**K.Point (lat, lng, properties)**

|Option|Type|Description|
|---|---|---|
|lat|Number|Latitude|
|lng|Number|Longitude|
|properties|Object (optional)|Properties of the point|
