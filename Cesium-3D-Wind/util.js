var Util = (function () {
	var getShaderCode = function (filePath) {
		var request = new XMLHttpRequest();
		request.open('GET', filePath, false);
		request.send(null);
		return request.responseText;
	}

	var debug = function (animate) {
		spector = new SPECTOR.Spector();
		spector.displayUI();
		spector.spyCanvases();

		animate();
	}

	return {
		getShaderCode: getShaderCode,
		debug: debug
	};
})();