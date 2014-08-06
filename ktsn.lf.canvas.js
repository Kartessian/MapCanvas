window.K = {
    init: function (options) {
        if (options.map) {
            this._map = options.map;
        } else {
            L.mapbox.accessToken = options.token;
            this._map = L.mapbox.map(options.div, options.key).setView([0, 0], 3);
        }

        this._pane = null;
        this._layers = [];
        this._base = new this.baseLayer();
        this._map.addLayer(this._base);
    },

    baseLayer: L.Class.extend({

        // Leaflet API implementation

        initialize: function () { },

        onAdd: function (map) {
            var pane = map.getPanes().overlayPane;
            // add the canvas for each layer (if any)
            for (var i = 0, len = K._layers.length; i < len; i++) {
                var canvas = document.createElement("canvas");
                canvas.style.position = 'absolute';
                pane.appendChild(canvas);
                K._layers[i]._canvas = canvas;
            }
            K._pane = pane;

            this._moveend = map.on('moveend', K._draw, this);
            this._mousemove = map.on('mousemove', K._move, this);
            this._click = map.on('click', K._click, this);
        },

        onRemove: function (map) {
            var pane = K._pane;
            // remove all the canvas objects inside the pane
            for (var i = 0, len = K._layers.length; i < len; i++) {
                pane.removeChild(K._layers[i]._canvas);
            }
            map.off('moveend', K._draw, this);
            this._moveend = null;
            map.off('mousemove', K._move, this);
            this._mousemove = null;
            map.off('click', K._move, this);
            this._click = null;
        },

    }),

    // public methods

    addLayer: function (layer) {

        this._layers.push(layer);

        // shall it refresh after adding the layer?
        this._draw();

        return this._layers.length;
    },

    destroy: function () {
        // basic detroy implementation, needs further consideration
        K._base.onRemove(K._map);
        K._layers = [];
    },

    removeLayer: function (layerId) {
        // remove the canvas from the pane
        this._pane.removeChild(this._layers[layerId]);
        // remove the layer from the array
        this._layers.splice(layerId, 1);
    },

    // constructors

    Layer: function (name, style) {
        this.points = [];
        this.style = style;
        this.visible = true;

        this.name = name;

        this.addPoint = function (point) {
            this.points.push(point);
        };

        this.addRange = function (range) {
            var points = this._points;
            for (var i = 0, len = range.length; i < len; i++) {
                points.push(range[i]);
            }
        };

        this.set = function (option, value) {
            if (typeof option == 'object') {
                for (var key in option) {
                    this[key] = option[key];
                }
            } else {
                this[option] = value;
            }
            return this;
        };
    },

    Point: function (lat, lng, properties) {
        this.geo = L.latLng(lat, lng);
        if (properties) {
            for (var prop in properties) {
                this[prop] = properties[prop];
            }
        }
    },

    // private methods
    _click: function (e) {
        if (this._layerOver < 0) return;

        var layer = K._layers[this._layerOver];

        // find the closest point to the current location
        // pending: try some other way to find the point without going through all the array
        // maybe ordering the array in some way (like distance to 0,0) 
        for (var i = 0, len = layer.points.length; i < len; i++) {
            var geo = layer.points[i];
            // to be continued ...
        }

    },

    _draw: function () {

        if (K._map === undefined) return;

        var map = K._map,
            mapbounds = map.getBounds(),
            zoomlevel = map.getZoom(),
            sw = map.latLngToLayerPoint(mapbounds._southWest),
            ne = map.latLngToLayerPoint(mapbounds._northEast),
            canvasWidth = Math.round(ne.x - sw.x),
            canvasHeight = Math.round(sw.y - ne.y),
            _left = Math.round(sw.x) + 'px',
            _top = Math.round(ne.y) + 'px';

        /* could be that the canvas is not created yet */
        for (var i = 0, len = K._layers.length; i < len; i++) {

            // the reason to put this code here is that sometimes the layer is being added before the map
            // is created and added all the DOM elements
            if (K._layers[i]._canvas === undefined) {
                var canvas = document.createElement("canvas");
                canvas.style.position = 'absolute';
                K._pane.appendChild(canvas);
                K._layers[i]._canvas = canvas;
            }

            var layer = K._layers[i],
                style = layer.style,
                canvas = layer._canvas,
                hiddenCanvas = document.createElement("canvas");

            canvas.style.left = _left;
            canvas.style.top = _top;
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;

            hiddenCanvas.width = canvasWidth;
            hiddenCanvas.height = canvasHeight;

            // if the canvas will be completely transparent, no need to draw anything
            if (style.alpha <= 0) return;

            if (style.type == 'gradient') // if point type == gradient
            {
                K.drawGradient(style, hiddenCanvas, layer.points, mapbounds, map, sw, ne, zoomlevel);
            } else {
                if (style.type == 'simpleheat') {
                    K.drawSimpleHeat(style, layer.points, hiddenCanvas, mapbounds, map, sw, ne, zoomlevel);
                } else {
                    K.drawDot(style, layer.points, hiddenCanvas, mapbounds, map, sw, ne);
                }
            }

            var ctx = canvas.getContext("2d");
            ctx.drawImage(hiddenCanvas, 0, 0);
        }

    },

    _move: function (e) {
        var point = e.containerPoint,
            layerOver = -1;
        for (var layers = K._layers, i = layers.length - 1; i >= 0; i--) {
            var canvas = layers[i]._canvas;
            if (canvas != null) {
                var color = canvas.getContext("2d").getImageData(point.x, point.y, 1, 1).data;
                if (color[3] > 0) {
                    layerOver = i;
                    break;
                }
            }
        }
        // notice this is not being stored in the K object
        this._layerOver = layerOver;
        if (layerOver >= 0) {
            e.target._container.style.cursor = "pointer";
        } else {
            e.target._container.style.cursor = null;
        }
    },

    drawSimpleHeat: function (style, data, hiddenCanvas, mapbounds, overlayProjection, sw, ne, zoomlevel) {

        var context = hiddenCanvas.getContext("2d"),
            canvasWidth = hiddenCanvas.width,
            canvasHeight = hiddenCanvas.height,
            imageData = context.getImageData(0, 0, canvasWidth, canvasHeight),
            bytes = new Uint32Array(imageData.data.buffer),
            pointSize = style.pointSize,
            adjust = pointSize / 2,
            adjustPow = adjust * adjust,
            alphaSize = style.alpha,
            colors = K.drawing.getGradientPow(style.fillColor, style.borderColor, pointSize),
            swx = sw.x,
            ney = ne.y,
            maxPoint = 0,
            secMax = 0;

        for (var i = 0, len = data.length; i < len; i++) {

            var ltlng = data[i].geo;

            if (mapbounds.contains(ltlng)) {
                var startProjection = overlayProjection.latLngToLayerPoint(ltlng),
                    xpos = Math.round(startProjection.x - swx),
                    ypos = Math.round(startProjection.y - ney);

                var x0 = Math.round(xpos - adjust); if (x0 < 0) x0 = 0;
                var x1 = Math.round(xpos + adjust); if (x1 >= canvasWidth) x1 = canvasWidth - 1;
                var y0 = Math.round(ypos - adjust); if (y0 < 0) y0 = 0;
                var y1 = Math.round(ypos + adjust); if (y1 >= canvasHeight) y1 = canvasHeight - 1;

                while (y0 < y1) {

                    var yRow = y0 * canvasWidth;

                    for (var x = x0; x < x1; x++) {

                        var dist = (x - xpos) * (x - xpos) + (y0 - ypos) * (y0 - ypos);
                        if (dist <= adjustPow) {

                            var size = bytes[yRow + x] + 1;
                            if (size > maxPoint) {
                                maxPoint = size;
                            } else {
                                if (size > secMax) {
                                    secMax = size;
                                }
                            }
                            bytes[yRow + x] = size;
                        }

                    }

                    y0++;
                }

            }

        }

        var pattern = K.drawing.createPattern([{ r: 0, g: 0, b: 255 }, { r: 0, g: 255, b: 255 }, { r: 0, g: 255, b: 0 }, { r: 255, g: 255, b: 0 }, { r: 255, g: 0, b: 0 }], maxPoint);

        points = canvasHeight;
        while (points--) {
            var y = points * canvasWidth, x = canvasWidth;
            while (x--) {

                var ui32 = bytes[y + x];
                if (ui32 !== 0) {
                    var size = Math.round(ui32 * 255 / maxPoint),
                        alpha = Math.round(ui32 * 50 / maxPoint);

                    if (size > 255) size = 255;
                    if (alpha > 50) alpha = 50;
                    var c = pattern[ui32];

                    bytes[y + x] = ((150 + alpha) << 24) | (c.b << 16) | (c.g << 8) | (c.r);
                }
            }
        }

        context.putImageData(imageData, 0, 0);
    },

    drawGradient: function (style, hiddenCanvas, data, mapbounds, overlayProjection, sw, ne, zoomlevel) {

        var pointSize = style.pointSize;
        /* TODO -- need to adjust the this.colors_ array before changing the size of the point*/
        if (this.zoomadjust_) {
            //if (zoomlevel >= 19) {
            //    pointSize = pointSize * 4;
            //} else if (zoomlevel == 18) {
            //    pointSize = pointSize * 3;
            //} else if (zoomlevel == 17) {
            //    pointSize = pointSize * 2;
            //} else if (zoomlevel == 16) {
            //    pointSize = Math.round(pointSize * 1.5);
            //} else
            if (zoomlevel <= 3) {
                pointSize = 3;
            }
        }

        var context = hiddenCanvas.getContext("2d"),
            canvasWidth = hiddenCanvas.width,
            canvasHeight = hiddenCanvas.height,
            imageData = context.getImageData(0, 0, canvasWidth, canvasHeight),
            bytes = new Uint32Array(imageData.data.buffer),
            adjust = pointSize / 2,
            adjustPow = adjust * adjust,
            alphaSize = style.alpha,
            colors = K.drawing.getGradientPow(style.fillColor, style.borderColor, pointSize),
            swx = sw.x,
            ney = ne.y;


        for (var i = 0, len = data.length; i < len; i++) {

            var ltlng = data[i].geo;

            if (ltlng != null && mapbounds.contains(ltlng)) {

                var startProjection = overlayProjection.latLngToLayerPoint(ltlng),
                    xpos = Math.round(startProjection.x - swx);
                ypos = Math.round(startProjection.y - ney);

                var x0 = Math.round(xpos - adjust); if (x0 < 0) x0 = 0;
                var x1 = Math.round(xpos + adjust); if (x1 >= canvasWidth) x1 = canvasWidth - 1;
                var y0 = Math.round(ypos - adjust); if (y0 < 0) y0 = 0;
                var y1 = Math.round(ypos + adjust); if (y1 >= canvasHeight) y1 = canvasHeight - 1;

                while (y0 < y1) {

                    var yRow = y0 * canvasWidth;

                    for (var x = x0; x < x1; x++) {

                        var dist = (x - xpos) * (x - xpos) + (y0 - ypos) * (y0 - ypos);
                        if (dist <= adjustPow) {
                            //dist = Math.round(Math.sqrt(dist)); color array bigger, this shouldn't be needed
                            var color = colors[dist];
                            var ui32 = bytes[yRow + x];

                            // todo: test alternative for performance: !(ui32 >>> 24 >= alphaSize - dist)
                            if (ui32 === 0
                                    ||
                                    (ui32 !== 0 && (ui32 >>> 24 < alphaSize - dist))
                                ) {
                                bytes[yRow + x] =
                                ((alphaSize - dist) << 24) |	// alpha
                                (color.b << 16) |	// blue
                                (color.g << 8) |	// green
                                color.r;		    // red
                            }
                        }

                    }

                    y0++;
                }
            }
        }

        context.putImageData(imageData, 0, 0);

    },

    drawDot: function (style, data, hiddenCanvas, mapbounds, overlayProjection, sw, ne) {

        /* adjust the size of the dot based on the zoom level  */
        var pointSize = style.pointSize;
        if (style.zoomadjust) {
            if (zoomlevel >= 19) {
                pointSize = pointSize * 4;
            } else if (zoomlevel == 18) {
                pointSize = pointSize * 3;
            } else if (zoomlevel == 17) {
                pointSize = pointSize * 2;
            } else if (zoomlevel == 16) {
                pointSize = Math.round(pointSize * 1.5);
            } else if (zoomlevel <= 3) {
                pointSize = 3;
            }
        }

        /* the template point - will be copied everywhere a new point needs to be placed */
        var dot = K.drawing.createDot(style.type, style.fillColor.hex, style.borderColor.hex, pointSize, style.alpha);

        /* adjust to the position of the point as
            the center of the littlepoint should be actually the
            location of the point */
        var xadjust = sw.x + pointSize / 2,
            yadjust = ne.y + pointSize / 2,
            context = hiddenCanvas.getContext("2d");

        for (var i = 0, len = data.length; i < len; i++) {

            var ltlng = data[i].geo;

            if (mapbounds.contains(ltlng)) {

                var startProjection = overlayProjection.latLngToLayerPoint(ltlng);
                context.drawImage(
                        dot,
                        Math.round(startProjection.x - xadjust),
                        Math.round(startProjection.y - yadjust)
                    );

            }
        }

    },

    drawGradientDot: function (style, data, hiddenCanvas, mapbounds, overlayProjection, sw, ne) {
        /* like a dot but with different colors instead a solid one*/
        var littlepoint = document.createElement("canvas");

        littlepoint.width = style.pointSize;
        littlepoint.height = style.pointSize;

        var littlecontext = littlepoint.getContext("2d");
        littlecontext.globalAlpha = style.alpha / 255;
        littlecontext.beginPath();
        littlecontext.arc(style.pointSize / 2, style.pointSize / 2, style.pointSize / 2, 0, 2 * Math.PI, false);
        littlecontext.fillStyle = style.fillColor.hex;
        littlecontext.fill();
        littlecontext.lineWidth = 1;
        littlecontext.strokeStyle = style.borderColor.hex;
        littlecontext.stroke();

        var xadjust = sw.x + Math.round(style.pointSize / 2),
            yadjust = ne.y + Math.round(style.pointSize / 2),
            context = hiddenCanvas.getContext("2d");

        for (var i = 0, len = data.length; i < len; i++) {

            var ltlng = data[i].geo;

            if (mapbounds.contains(ltlng)) {

                var startProjection = overlayProjection.latLngToLayerPoint(ltlng);
                var xpos = Math.round(startProjection.x - xadjust);
                var ypos = Math.round(startProjection.y - yadjust);

                context.drawImage(littlepoint, xpos, ypos);

            }
        }

    },

    drawing: {
        getGradient: function (initialColor, finalColor, pointSize) {

            if (typeof initialColor == 'string') {
                initialColor = this.hexToRgb(initialColor);
            }

            if (typeof finalColor == 'string') {
                finalColor = this.hexToRgb(finalColor);
            }

            var steps = Math.round(pointSize / 2),
                rStep = (finalColor.r - initialColor.r) / steps,
                gStep = (finalColor.g - initialColor.g) / steps,
                bStep = (finalColor.b - initialColor.b) / steps,
                colors = [];

            for (var i = 0; i <= steps; i++) {
                var r = Math.round(initialColor.r + (rStep * i)),
                    g = Math.round(initialColor.g + (gStep * i)),
                    b = Math.round(initialColor.b + (bStep * i));

                colors.push({ "r": r, "g": g, "b": b, "hex": '#' + this.toHex(r) + this.toHex(g) + this.toHex(b) });
            }

            return colors;
        },

        getGradientPow: function (fillColor, endColor, pointSize) {
            var steps = Math.round(pointSize * pointSize / 4);

            var rStep = (endColor.r - fillColor.r) / steps;
            var gStep = (endColor.g - fillColor.g) / steps;
            var bStep = (endColor.b - fillColor.b) / steps;

            var colors = [];

            for (var i = 0; i <= steps; i++) {
                var r = Math.round(fillColor.r + (rStep * i));
                var g = Math.round(fillColor.g + (gStep * i));
                var b = Math.round(fillColor.b + (bStep * i));

                colors.push({ "r": r, "g": g, "b": b, "hex": '#' + this.toHex(r) + this.toHex(g) + this.toHex(b) });
            }

            return colors;
        },

        createPattern: function (colors, count) {
            var pattern = [], steps = Math.round(count / (colors.length - 1));

            for (var i = 0, len = colors.length - 1 ; i < len; i++) {

                var initialColor = colors[i],
                    finalColor = colors[i + 1],
                    rStep = (finalColor.r - initialColor.r) / steps,
                    gStep = (finalColor.g - initialColor.g) / steps,
                    bStep = (finalColor.b - initialColor.b) / steps;

                for (var j = 0 ; j <= steps; j++) {
                    var r = Math.round(initialColor.r + (rStep * j)),
                        g = Math.round(initialColor.g + (gStep * j)),
                        b = Math.round(initialColor.b + (bStep * j));

                    pattern.push({ "r": r, "g": g, "b": b });
                }

            }

            var fC = colors[colors.length - 1];
            while (pattern.length < count) {
                pattern.push(fC);
            }

            return pattern;
        },

        toHex: function (num) {
            num = num.toString(16);
            if (num.length == 1) num = "0" + num;
            return num;
        },

        hexToRgb: function (hex) {
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16),
                hex: hex
            } : null;
        },

        invertColor: function (color) {
            if (color[0] == '#') {
                color = color.substring(1);           // remove #
            }
            color = parseInt(color, 16);          // convert to integer
            color = 0xFFFFFF ^ color;             // invert three bytes
            color = color.toString(16);           // convert to hex
            color = ("000000" + color).slice(-6); // pad with leading zeros
            color = "#" + color;                  // prepend #
            return color;
        },

        createDot: function (type, fillColor, borderColor, size, alpha, steps) {
            /// <param name="type">dot type: simple, shadow</param>
            /// <param name="fillColor">dot inner color</param>
            /// <param name="borderColor">dot border color</param>
            /// <param name="size">total diameter of the dot</param>
            /// <param name="alpha">max alpha value</param>
            /// <param name="steps">number of steps for scatter dots</param>

            if (type == 'scatter') {
                if (steps > 1) {
                    return this.createScatterDot(fillColor, borderColor, size, alpha, steps);
                } else {
                    type = 'plain';
                }
            }

            var canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;

            var context = canvas.getContext("2d");

            switch (type) {
                case 'shadow':
                    // firt draw the shadow
                    context.globalAlpha = (alpha / 255) / 2;
                    context.beginPath();
                    context.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI, false);
                    context.fillStyle = fillColor;
                    context.fill();
                    // then place the dot
                    context.globalAlpha = alpha / 255;
                    context.beginPath();
                    context.arc(size / 2, size / 2, size / 4, 0, 2 * Math.PI, false);
                    context.fillStyle = fillColor;
                    context.fill();
                    context.lineWidth = 1;
                    context.strokeStyle = borderColor;
                    context.stroke();
                    break;
                case 'plain':
                    context.globalAlpha = alpha / 255;
                    context.beginPath();
                    context.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI, false);
                    context.fillStyle = fillColor;
                    context.fill();
                    context.lineWidth = 1;
                    context.strokeStyle = borderColor;
                    context.stroke();
                    break;
            }

            return canvas;
        },

        createScatterDot: function (initialColor, finalColor, size, alpha, steps) {

            var colors = this.getGradient(initialColor, finalColor, steps * 2),
                points = [];
            for (var i = 0, len = colors.length; i < len; i++) {
                points.push(this.createDot('plain', colors[i].hex, this.invertColor(colors[i].hex), size, alpha));
            }
            return points;

        }
    }
};
