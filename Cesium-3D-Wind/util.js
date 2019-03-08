var Util = (function () {
	var getShaderCode = function (filePath) {
		var request = new XMLHttpRequest();
		request.open('GET', filePath, false);
		request.send(null);
		return request.responseText;
	}

	var rectangleToMinMax = function (viewRectangle) {
		var result = {};

		var west = Cesium.Math.toDegrees(viewRectangle.west);
		var east = Cesium.Math.toDegrees(viewRectangle.east);

		var south = Cesium.Math.toDegrees(viewRectangle.south);
		var north = Cesium.Math.toDegrees(viewRectangle.north);

		result.min = {
			lon: Math.min(east, west), // in Cesium.Rectangle, west may be larger than east
			lat: south,
			lev: undefined, // need to be defined later
		};

		result.max = {
			lon: Math.max(east, west),
			lat: north,
			lev: undefined,
		};

		return result;
	}

	var debug = function (animateFunction) {
		spector = new SPECTOR.Spector();
		spector.displayUI();
		spector.spyCanvases();

		animateFunction();
	}

	return {
		getShaderCode: getShaderCode,
		rectangleToMinMax: rectangleToMinMax,
		debug: debug
	};
})();