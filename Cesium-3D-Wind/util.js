var Util = (function () {
	var getShaderCode = function (filePath) {
		var request = new XMLHttpRequest();
		request.open('GET', filePath, false);
		request.send(null);
		return request.responseText;
	}

	var rectangleToLonLatBound = function (viewRectangle) {
		var result = {};
		result.min = {};
		result.max = {};

		var west = Cesium.Math.toDegrees(viewRectangle.west);
		var east = Cesium.Math.toDegrees(viewRectangle.east);
		var width = Cesium.Math.toDegrees(viewRectangle.width);

		var south = Cesium.Math.toDegrees(viewRectangle.south);
		var north = Cesium.Math.toDegrees(viewRectangle.north);
		var height = Cesium.Math.toDegrees(viewRectangle.height);

		// in Cesium.Rectangle, west may be larger than east
		result.min.lon = Cesium.Math.clamp(Math.min(east, west) - width / 2, -180.0, 180.0);
		result.max.lon = Cesium.Math.clamp(Math.max(east, west) + width / 2, -180.0, 180.0);

		result.min.lat = Cesium.Math.clamp(south - height / 2, -90.0, 90.0);
		result.max.lat = Cesium.Math.clamp(north + height / 2, -90.0, 90.0);

		if (result.min.lat < -65.0) {
			result.min.lat = -90.0;
		}
		if (result.max.lat > -65.0) {
			result.max.lat = 90.0;
		}

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
		rectangleToLonLatBound: rectangleToLonLatBound,
		debug: debug
	};
})();