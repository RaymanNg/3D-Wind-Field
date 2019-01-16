var Util = (function () {
	var NetCDFdata;
	var textures;

	var loadNetCDF = function (filePath) {
		return new Promise((resolve) => {
			let loader = new THREE.FileLoader();
			loader.setResponseType('arraybuffer');
			loader.load(filePath, (arraybuffer) => {
				let NetCDF = new netcdfjs(arraybuffer);
				NetCDFdata = {};

				let arrayToMap = (array) => {
					return array.reduce(function (map, object) {
						map[object.name] = object;
						return map;
					}, {});
				}

				let dimensions = arrayToMap(NetCDF.dimensions);
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
		for (let i = 0; i < maxParticles; i++) {
			particlesArray[3 * i] = 1000 - 2000 * Math.random();
			particlesArray[3 * i + 1] = 1000 - 2000 * Math.random();
			particlesArray[3 * i + 2] = 1000 - 2000 * Math.random();
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

		let maxParticles = particleTextureSize * particleTextureSize;
		let particlesArray = new Float32Array(3 * maxParticles);
		particlesArray = randomizeParticle(maxParticles, particlesArray);
		textures.particlePosition = new THREE.DataTexture(particlesArray,
			particleTextureSize, particleTextureSize,
			THREE.RGBFormat, THREE.FloatType);
		textures.particlePosition.needsUpdate = true;

		return textures;
	}

	var getShaderCode = function (filePath) {
		let request = new XMLHttpRequest();
		request.open('GET', filePath, false);
		request.send(null);
		return request.responseText;
	}

	var initParticleSystem = function (particleTextureSize) {
		let fullscreenQuad = new THREE.PlaneBufferGeometry(2, 2);

		let fullscreenShader = getShaderCode('glsl/fullscreen.vert');
		let updateShader = getShaderCode('glsl/update.frag');
		let particleShaderMaterial = new THREE.ShaderMaterial({
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

		let particleSystem = new THREE.Mesh(fullscreenQuad, particleShaderMaterial);
		return particleSystem;
	}

	var initParticlePoints = function (particleTextureSize, currentParticlePosition) {
		let index = new THREE.BufferGeometry();
		let particleIndex = [];
		for (let u = 0; u < particleTextureSize; u++) {
			for (let v = 0; v < particleTextureSize; v++) {
				particleIndex.push(u / particleTextureSize);
				particleIndex.push(v / particleTextureSize);
				particleIndex.push(0.0);
			}
		}
		particleIndex = new Float32Array(particleIndex);
		index.addAttribute('position', new THREE.BufferAttribute(particleIndex, 3));

		let pointDrawVert = getShaderCode('glsl/pointDraw.vert');
		let pointDrawFrag = getShaderCode('glsl/pointDraw.frag');
		let drawShaderMaterial = new THREE.ShaderMaterial({
			uniforms: {
				particles: {
					value: currentParticlePosition.texture
				}
			},
			vertexShader: pointDrawVert,
			fragmentShader: pointDrawFrag
		});
		let particlePoints = new THREE.Points(index, drawShaderMaterial);
		return particlePoints;
	}

	var initParticleTrails = function (pointsTetxure, previousTrails, fadeOpacity) {
		let fullscreenQuad = new THREE.PlaneBufferGeometry(2, 2);

		let fullscreenShader = getShaderCode('glsl/fullscreen.vert');
		let trailShader = getShaderCode('glsl/trailDraw.frag');
		let trailShaderMaterial = new THREE.ShaderMaterial({
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

		let particleTrails = new THREE.Mesh(fullscreenQuad, trailShaderMaterial);
		return particleTrails;
	}

	var initScreen = function (previousTrails) {
		let fullscreenQuad = new THREE.PlaneBufferGeometry(2, 2);

		let fullscreenShader = getShaderCode('glsl/fullscreen.vert');
		let screenShader = getShaderCode('glsl/screenDraw.frag');
		let screenShaderMaterial = new THREE.ShaderMaterial({
			uniforms: {
				screen: {
					value: previousTrails.texture
				}
			},
			vertexShader: fullscreenShader,
			fragmentShader: screenShader
		});

		let screen = new THREE.Mesh(fullscreenQuad, screenShaderMaterial);
		return screen;
	}

	return {
		loadNetCDF: loadNetCDF,
		setupTextures: setupTextures,
		initParticleSystem: initParticleSystem,
		initParticlePoints: initParticlePoints,
		initParticleTrails: initParticleTrails,
		initScreen: initScreen
	};
})();