var Util = (function () {
	var NetCDFdata;
	var textures;

	var loadNetCDF = function (filePath) {
		return new Promise((resolve) => {
			var loader = new THREE.FileLoader();
			loader.setResponseType('arraybuffer');
			loader.load(filePath, (arraybuffer) => {
				var NetCDF = new netcdfjs(arraybuffer);
				NetCDFdata = {};

				var arrayToMap = (array) => {
					return array.reduce(function (map, object) {
						map[object.name] = object;
						return map;
					}, {});
				}

				var dimensions = arrayToMap(NetCDF.dimensions);
				NetCDFdata.lonSize = dimensions['lon'].size;
				NetCDFdata.latSize = dimensions['lat'].size;
				NetCDFdata.levSize = dimensions['lev'].size;

				NetCDFdata.lonArray = new Float32Array(NetCDF.getDataVariable('lon').flat());
				NetCDFdata.latArray = new Float32Array(NetCDF.getDataVariable('lat').flat());
				NetCDFdata.levArray = new Float32Array(NetCDF.getDataVariable('lev').flat());
				NetCDFdata.UArray = new Float32Array(NetCDF.getDataVariable('U').flat());
				NetCDFdata.VArray = new Float32Array(NetCDF.getDataVariable('V').flat());

				resolve(NetCDFdata);
			});
		});
	}

	var randomizeParticle = function (maxParticles, particlesArray) {
		NetCDFdata.lonMin = NetCDFdata.lonArray[0];
		NetCDFdata.lonMax = NetCDFdata.lonArray[NetCDFdata.lonArray.length - 1];

		NetCDFdata.latMin = NetCDFdata.latArray[0];
		NetCDFdata.latMax = NetCDFdata.latArray[NetCDFdata.latArray.length - 1];

		NetCDFdata.levMin = NetCDFdata.levArray[0];
		NetCDFdata.levMax = NetCDFdata.levArray[NetCDFdata.levArray.length - 1];

		for (var i = 0; i < maxParticles; i++) {
			particlesArray[3 * i] = Math.random() * (NetCDFdata.lonMax - NetCDFdata.lonMin) + NetCDFdata.lonMin;
			particlesArray[3 * i + 1] = Math.random() * (NetCDFdata.latMax - NetCDFdata.latMin) + NetCDFdata.latMin;
			particlesArray[3 * i + 2] = Math.random() * (NetCDFdata.levMax - NetCDFdata.levMin) + NetCDFdata.levMin;
		}
		return particlesArray;
	}

	var setupTextures = function (particleTextureSize) {
		textures = {};
		textures.U = new THREE.DataTexture(NetCDFdata.UArray,
			NetCDFdata.lonSize, NetCDFdata.latSize * NetCDFdata.levSize,
			THREE.LuminanceFormat, THREE.FloatType);
		textures.U.needsUpdate = true;

		textures.V = new THREE.DataTexture(NetCDFdata.VArray,
			NetCDFdata.lonSize, NetCDFdata.latSize * NetCDFdata.levSize,
			THREE.LuminanceFormat, THREE.FloatType);
		textures.V.needsUpdate = true;

		var maxParticles = particleTextureSize * particleTextureSize;
		var particlesArray = new Float32Array(3 * maxParticles);
		particlesArray = randomizeParticle(maxParticles, particlesArray);

		textures.particlePosition = new THREE.DataTexture(particlesArray,
			particleTextureSize, particleTextureSize,
			THREE.RGBFormat, THREE.FloatType);
		textures.particlePosition.needsUpdate = true;

		return textures;
	}

	var getShaderCode = function (filePath) {
		var request = new XMLHttpRequest();
		request.open('GET', filePath, false);
		request.send(null);
		return request.responseText;
	}

	var initParticleSystem = function (particleTextureSize) {
		var fullscreenQuad = new THREE.PlaneBufferGeometry(2, 2);

		var fullscreenShader = getShaderCode('glsl/fullscreen.vert');
		var updateShader = getShaderCode('glsl/update.frag');
		var particleShaderMaterial = new THREE.ShaderMaterial({
			uniforms: {
				U: {
					value: textures.U
				},
				V: {
					value: textures.V
				},
				windFieldDimensions: {
					value: new THREE.Vector3(NetCDFdata.lonSize, NetCDFdata.latSize, NetCDFdata.levSize)
				},
				windFieldSteps: {
					value: new THREE.Vector3(
						(NetCDFdata.lonMax - NetCDFdata.lonMin) / NetCDFdata.lonArray.length,
						(NetCDFdata.latMax - NetCDFdata.latMin) / NetCDFdata.latArray.length,
						(NetCDFdata.levMax - NetCDFdata.levMin) / NetCDFdata.levArray.length
					)
				},
				particles: {
					value: textures.particlePosition
				},
				size: {
					value: particleTextureSize
				}
			},
			vertexShader: fullscreenShader,
			fragmentShader: updateShader
		});

		var particleSystem = new THREE.Mesh(fullscreenQuad, particleShaderMaterial);
		return particleSystem;
	}

	var initParticlePoints = function (particleTextureSize, currentParticlePosition) {
		var index = new THREE.BufferGeometry();
		var particleIndex = [];
		for (var u = 0; u < particleTextureSize; u++) {
			for (var v = 0; v < particleTextureSize; v++) {
				particleIndex.push(u / particleTextureSize);
				particleIndex.push(v / particleTextureSize);
				particleIndex.push(0.0);
			}
		}
		particleIndex = new Float32Array(particleIndex);
		index.addAttribute('position', new THREE.BufferAttribute(particleIndex, 3));

		var pointDrawVert = getShaderCode('glsl/pointDraw.vert');
		var pointDrawFrag = getShaderCode('glsl/pointDraw.frag');
		var drawShaderMaterial = new THREE.ShaderMaterial({
			uniforms: {
				particles: {
					value: currentParticlePosition.texture
				},
				cesiumProjection: {
					value: new THREE.Matrix4()
				},
				cesiumView: {
					value: new THREE.Matrix4()
				}
			},
			vertexShader: pointDrawVert,
			fragmentShader: pointDrawFrag
		});
		var particlePoints = new THREE.Points(index, drawShaderMaterial);
		return particlePoints;
	}

	var initParticleTrails = function (pointsTetxure, previousTrails, fadeOpacity) {
		var fullscreenQuad = new THREE.PlaneBufferGeometry(2, 2);

		var fullscreenShader = getShaderCode('glsl/fullscreen.vert');
		var trailShader = getShaderCode('glsl/trailDraw.frag');
		var trailShaderMaterial = new THREE.ShaderMaterial({
			uniforms: {
				particlePoints: {
					value: pointsTetxure.texture
				},
				previousTrails: {
					value: previousTrails.texture
				},
				fadeOpacity: {
					value: fadeOpacity
				}
			},
			vertexShader: fullscreenShader,
			fragmentShader: trailShader
		});

		var particleTrails = new THREE.Mesh(fullscreenQuad, trailShaderMaterial);
		return particleTrails;
	}

	var initScreen = function (textureToUse) {
		var fullscreenQuad = new THREE.PlaneBufferGeometry(2, 2);

		var fullscreenShader = getShaderCode('glsl/fullscreen.vert');
		var screenShader = getShaderCode('glsl/screenDraw.frag');
		var screenShaderMaterial = new THREE.ShaderMaterial({
			uniforms: {
				screen: {
					value: textureToUse
				}
			},
			vertexShader: fullscreenShader,
			fragmentShader: screenShader
		});

		var screen = new THREE.Mesh(fullscreenQuad, screenShaderMaterial);
		return screen;
	}

	return {
		loadNetCDF: loadNetCDF,
		getShaderCode: getShaderCode,
		setupTextures: setupTextures,
		initParticleSystem: initParticleSystem,
		initParticlePoints: initParticlePoints,
		initParticleTrails: initParticleTrails,
		initScreen: initScreen
	};
})();