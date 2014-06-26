lCanvas.prototype.drawSimpleHeat = function (hiddenCanvas, mapbounds, map, sw, ne) {

    var hiddenContext = hiddenCanvas.getContext("2d"),
        canvasWidth = hiddenCanvas.width,
        canvasHeight = hiddenCanvas.height,

        // will use the image data as we are going to play with single pixels
        imageData = hiddenContext.getImageData(0, 0, canvasWidth, canvasHeight),
        // get a byte array with all the pixels in the image. by default all of them should be 0
        // we will use the same array to calculate the number of points per pixel and then 
        // transfor that data into the color in the palete for that pixel
        bytes = new Uint32Array(imageData.data.buffer),

        pointSize = this.pointSize,
        adjust = pointSize / 2,
        adjustPow = adjust * adjust,
        swx = sw.x,
        ney = ne.y,
        maxPoint = 0;


    // first thing is to calculate the "heat" of each pixel, based on the number of concurrent points on it
    // don't need to go through all the points in the canvas, only the visible points
    for (var i = 0, points = this._points, len = points.length; i < len; i++) {

        var ltlng = points[i];

        if (mapbounds.contains(ltlng)) {

            var layerPointPosition = map.latLngToLayerPoint(ltlng),
                xpos = Math.round(layerPointPosition.x - swx),
                ypos = Math.round(layerPointPosition.y - ney),
                x0 = Math.round(xpos - adjust), 
                x1 = Math.round(xpos + adjust), 
                y0 = Math.round(ypos - adjust), 
                y1 = Math.round(ypos + adjust); 

            // try to avoid to use pixels out of the canvas size
            if (x0 < 0) x0 = 0;
            if (x1 >= canvasWidth) x1 = canvasWidth - 1;
            if (y0 < 0) y0 = 0;
            if (y1 >= canvasHeight) y1 = canvasHeight - 1;

            while (y0 < y1) {

                var yRow = y0 * canvasWidth;

                while (x0 < x1)
                    // using the distance between 2 points formula pretty simplified to give a circle appearance
                    // to each point, otherwise would look "pixelated" like squares.
                    var dist = (x0 - xpos) * (x0 - xpos) + (y0 - ypos) * (y0 - ypos);
                    if (dist <= adjustPow) {
                        // increment the pixel value by 1
                        var size = bytes[yRow + x] + 1;
                        // I want to store the maxPoint value to create the color pattern
                        if (size > maxPoint) { maxPoint = size; }
                        // set the new pixel value
                        bytes[yRow + x] = size;

                        // this could be simplified to
                        // bytes[yRow + x] += 1;
                        // if you don't care about the maximum value
                    }

                    x0++;
                }

                y0++;
            }

        }

    }

    var pattern = this.createColorPattern([
        { r: 0, g: 0, b: 255 }, // blue
        { r: 0, g: 255, b: 255 }, // cyan
        { r: 0, g: 255, b: 0 },  // green
        { r: 255, g: 255, b: 0 }, // yellow
        { r: 255, g: 0, b: 0 }], // red
        maxPoint);

    // once we have all the points placed into the imageData 
    // will go through it again to replace the values for the color in the palette
    points = canvasHeight;
    while (points--) {

        var y = points * canvasWidth,
            x = canvasWidth;

        while (x--) {

            // retrieve the "heat" value for that pixel
            var ui32 = bytes[y + x];

            if (ui32 !== 0) {
                
                // this is to make higher values less opacity (but don't make then opaque)
                var alpha = Math.round(ui32 * 50 / maxPoint);
                
                // fix possible values - shouldn't be needed
                if (alpha > 50) alpha = 50;
                
                // fetch the color associated to the pixel value from the pattern
                var c = pattern[ui32];
                
                // set the pixel value based on it's new color value
                bytes[y + x] = ((150 + alpha) << 24) | (c.b << 16) | (c.g << 8) | (c.r);
            }
        }
    }

    // put the bytes back to the canvas
    hiddenContext.putImageData(imageData, 0, 0);
}

lCanvas.prototype.createColorPattern = function (colors, count) {
    // colors = Array of colors to use, at least an initial and final color must be provided
    // count = total number of colors you need to create
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

    // sometime it just stop 1 color before the count specified
    // due to decimal and round conversion, so it will add the last color
    // to complete the count
    var fC = colors[colors.length - 1];
    while (pattern.length < count) {
        pattern.push(fC);
    }

    return pattern;
}
