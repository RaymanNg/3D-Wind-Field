var Util = (function () {
	var getShaderCode = function (filePath) {
		var request = new XMLHttpRequest();
		request.open('GET', filePath, false);
		request.send(null);
		return request.responseText;
	}

	var fullscreenQuad = undefined;
	var getFullscreenQuad = function () {
		if (!Cesium.defined(fullscreenQuad)) {
			fullscreenQuad = new Cesium.Geometry({
				attributes: new Cesium.GeometryAttributes({
					position: new Cesium.GeometryAttribute({
						componentDatatype: Cesium.ComponentDatatype.FLOAT,
						componentsPerAttribute: 3,
						//  v3----v2
						//  |     |
						//  |     |
						//  v0----v1
						values: new Float32Array([
							-1, -1, 0, // v0
							1, -1, 0, // v1
							1, 1, 0, // v2
							-1, 1, 0, // v3
						])
					}),
					st: new Cesium.GeometryAttribute({
						componentDatatype: Cesium.ComponentDatatype.FLOAT,
						componentsPerAttribute: 2,
						values: new Float32Array([
							0, 0,
							1, 0,
							1, 1,
							0, 1,
						])
					})
				}),
				indices: new Uint32Array([3, 2, 0, 0, 2, 1])
			});
		}
		return fullscreenQuad;
	}

	var dataTextureSampler = undefined;
	var getDataTextureSampler = function () {
		if (!Cesium.defined(dataTextureSampler)) {
			dataTextureSampler = new Cesium.Sampler({
				// the values of data texture should not be interpolated
				minificationFilter: Cesium.TextureMinificationFilter.NEAREST,
				magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST
			});
		}
		return dataTextureSampler;
	}

	var createTexture = function (options, typedArray) {
		if (Cesium.defined(typedArray)) {
			// typed array needs to be passed as source option, this is required by Cesium.Texture
			var source = {};
			source.arrayBufferView = typedArray;
			options.source = source;
		}

		var texture = new Cesium.Texture(options);
		return texture;
	}

	var createFramebuffer = function (context, colorTexture, depthTexture) {
		var framebuffer = new Cesium.Framebuffer({
			context: context,
			colorTextures: [colorTexture],
			depthTexture: depthTexture
		});
		return framebuffer;
	}

	var createRawRenderState = function (options) {
		var translucent = true;
		var closed = false;
		var existing = {
			viewport: options.viewport,
			depthTest: options.depthTest,
			depthMask: options.depthMask,
			blending: options.blending
		};

		var rawRenderState = Cesium.Appearance.getDefaultRenderState(translucent, closed, existing);
		return rawRenderState;
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
		getFullscreenQuad: getFullscreenQuad,
		getDataTextureSampler: getDataTextureSampler,
		createTexture: createTexture,
		createFramebuffer: createFramebuffer,
		createRawRenderState: createRawRenderState,
		rectangleToLonLatBound: rectangleToLonLatBound,
		debug: debug
	};
})();