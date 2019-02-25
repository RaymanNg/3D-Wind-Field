var Util = (function () {
	var getShaderCode = function (filePath) {
		var request = new XMLHttpRequest();
		request.open('GET', filePath, false);
		request.send(null);
		return request.responseText;
	}

	var debug = function (scene) {
		spector = new SPECTOR.Spector();
		spector.displayUI();
		spector.spyCanvases();

		var animate = function () {
			scene.render();
			requestAnimationFrame(animate);
		}

		animate();
	}

	return {
		getShaderCode: getShaderCode,
		debug: debug
	};
})();