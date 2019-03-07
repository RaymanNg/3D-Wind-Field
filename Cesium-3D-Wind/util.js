var Util = (function () {
	var getShaderCode = function (filePath) {
		var request = new XMLHttpRequest();
		request.open('GET', filePath, false);
		request.send(null);
		return request.responseText;
	}

	var rectangleToMinMax = function (viewRectangle) {
		var result = {};

		// convert the range of Cesium to the range of NetCDF file

		// the range of longitude in my NetCDF file is [0, 360]
		// the range of longitude in Cesium is [-Pi, Pi] and -180 is the same as +180!

		// the range of latitude in my NetCDF file is [-90, 90]
		// the range of latitude in Cesium [-Pi/2, Pi/2]

		var west = Cesium.Math.toDegrees(viewRectangle.west);
		var east = Cesium.Math.toDegrees(viewRectangle.east);

		var south = Cesium.Math.toDegrees(viewRectangle.south);
		var north = Cesium.Math.toDegrees(viewRectangle.north);

		result.min = {
			lon: Math.min(east, west),
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