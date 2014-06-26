var lCanvas = L.Class.extend({
    initialize: function (name) {
        this._name_ = name;
        this._canvas = null;
        this._points = [];
        this._pointType = 'simple';
        this._pointSize = 6;
    },

    onAdd: function (map) {

        this._map = map;

        // create a DOM element and put it into one of the map panes
        var canvas = document.createElement('canvas');
        canvas.style.position = "absolute";
        this._canvas = canvas;

        map.getPanes().overlayPane.appendChild(canvas);

        map.on('moveend', this._reset, this);

        this._reset();
    },

    onRemove: function (map) {
        // remove layer's DOM elements and listeners
        map.off('moveend', this._reset, this);
        map.getPanes().overlayPane.removeChild(this._el);
        this._canvas.parentNode.removeChild(this.canvas_);
        this._canvas = null;
    },

    _reset: function () {
        this.drawn();
    }
});

lCanvas.prototype.addPoint = function (point) {
    // point must be a L.latLng()
    this._points.push(point);
}

lCanvas.prototype.cleanPoints = function () {
    this._points = [];
}

lCanvas.prototype.drawn = function () {

    /* could be that the canvas is not created yet */
    if (this._canvas == null) {
        return;
    }

    var map = this._map,
        canvas = this._canvas,
        mapbounds = map.getBounds(),
        sw = map.latLngToLayerPoint(mapbounds._southWest),
        ne = map.latLngToLayerPoint(mapbounds._northEast),
        canvasWidth = Math.round(ne.x - sw.x),
        canvasHeight = Math.round(sw.y - ne.y),
        hiddenCanvas = document.createElement("canvas");

    canvas.style.left = Math.round(sw.x) + 'px';
    canvas.style.top = Math.round(ne.y) + 'px';
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // The hidden canvas will be used to perform the drawing/rendering of the points
    // once it is complete it will be drawn into the real visible canvas
    // in this way we only draw to the visible dom once, is faster than drawing to the
    // visible canvas directly

    hiddenCanvas.width = canvasWidth;
    hiddenCanvas.height = canvasHeight;

    switch (this._pointType) {
        case 'simple':
            this.drawSimpleDot(hiddenCanvas, mapbounds, map, sw, ne);
            break;
    }
    // there is always the posibility to not use a switch and call directly the function
    // this[this._potinType](hiddenCanvas, mapbounds, map, sw, ne);

    var ctx = canvas.getContext("2d");
    ctx.drawImage(hiddenCanvas, 0, 0);

}

/* Point Drawing implementation */
lCanvas.prototype.drawSimpleDot = function (hiddenCanvas, mapbounds, map, sw, ne) {

    /* create the dot once, it will be then used for all the dots */
    var dotCanvas = document.createElement("canvas");
    dotCanvas.width = this._pointSize;
    dotCanvas.height = this._pointSize;

    var dotContext = dotCanvas.getContext("2d");
    dotContext.globalAlpha = 1,
    dotContext.beginPath();
    dotContext.arc(this._pointSize / 2, this._pointSize / 2, this._pointSize / 2, 0, 2 * Math.PI, false);
    dotContext.fillStyle = '#ff0000';
    dotContext.fill();
    dotContext.lineWidth = 1;
    dotContext.strokeStyle = '#f0f0f0';
    dotContext.stroke();


    /* adjust to the position of the point as
        the center of the littlepoint should be actually the
        location of the point */
    var xadjust = sw.x + this._pointSize / 2,
        yadjust = ne.y + this._pointSize / 2,
        hiddenContext = hiddenCanvas.getContext("2d");

    for (var i = 0, points = this._points, len = points.length; i < len; i++) {

        var ltlng = points[i];

        if (mapbounds.contains(ltlng)) { // draw only visible points

            // convert lat/lng coordinates to x/y and adjust the position in the canvas
            var layerPointPosition = map.latLngToLayerPoint(ltlng);

            hiddenContext.drawImage(
                    dotCanvas,
                    Math.round(layerPointPosition.x - xadjust),
                    Math.round(layerPointPosition.y - yadjust)
                );

        }
    }

}
