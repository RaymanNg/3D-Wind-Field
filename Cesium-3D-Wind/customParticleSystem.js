var ParticleSystem = (function () {
    var data;
    var context;

    /** @type {Cesium.Texture} */var U;
    /** @type {Cesium.Texture} */var V;

    /** @type {Cesium.Texture} */var particlesTexture0;
    /** @type {Cesium.Texture} */var particlesTexture1;

    /** @type {Cesium.Framebuffer} */var particlesFramebuffer0;
    /** @type {Cesium.Framebuffer} */var particlesFramebuffer1;

    var fromParticles;
    var toParticles;

    /** @type {Cesium.Geometry} */var fullscreenQuad;
    /** @type {Cesium.Primitive} */var computePrimitive;

    /** @type {Cesium.Geometry} */var particlePoints;
    /** @type {Cesium.Primitive} */var particlePointsPrimitive;

    var createDataTexture = function (typedArray, options) {
        var source = {};
        source.arrayBufferView = typedArray; // source is required by Cesium.Texture 
        options.source = source;

        var texture = new Cesium.Texture(options);

        // texture.type = 'sampler2D'; 
        // workaround for uniform type check, it is necessary only if
        // we want to use Cesium.Texture as uniform value in Cesium.Material

        return texture;
    }

    var setupTextures = function () {
        const uvTextureOptions = {
            context: context,
            width: data.dimensions.lon,
            height: data.dimensions.lat * data.dimensions.lev,
            pixelFormat: Cesium.PixelFormat.RGB,
            PixelDatatype: Cesium.PixelDatatype.FLOAT
        };

        U = createDataTexture(data.U.array, uvTextureOptions);
        V = createDataTexture(data.V.array, uvTextureOptions);

        const particlesTextureOptions = {
            context: context,
            width: data.particles.textureSize,
            height: data.particles.textureSize,
            pixelFormat: Cesium.PixelFormat.RGB,
            PixelDatatype: Cesium.PixelDatatype.FLOAT
        };

        particlesTexture0 = createDataTexture(data.particles.array, particlesTextureOptions);
        particlesTexture1 = createDataTexture(data.particles.array, particlesTextureOptions);
    }

    var setupFramebuffers = function () {
        particlesFramebuffer0 = new Cesium.Framebuffer({
            context: context,
            colorTextures: [particlesTexture0],
            depthTexture: new Cesium.Texture({
                context: context,
                width: data.particles.textureSize,
                height: data.particles.textureSize,
                pixelFormat: Cesium.PixelFormat.DEPTH_COMPONENT,
                pixelDatatype: Cesium.PixelDatatype.UNSIGNED_SHORT
            })
        });

        particlesFramebuffer1 = new Cesium.Framebuffer({
            context: context,
            colorTextures: [particlesTexture1],
            depthTexture: new Cesium.Texture({
                context: context,
                width: data.particles.textureSize,
                height: data.particles.textureSize,
                pixelFormat: Cesium.PixelFormat.DEPTH_COMPONENT,
                pixelDatatype: Cesium.PixelDatatype.UNSIGNED_SHORT
            })
        });

        fromParticles = particlesFramebuffer0;
        toParticles = particlesFramebuffer1;
    }

    var initComputePrimitive = function () {
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
            primitiveType: Cesium.PrimitiveType.TRIANGLES,
            indices: new Uint32Array([3, 2, 0, 0, 2, 1])
        });

        var attributeLocations = {
            position: 0,
            st: 1
        };

        var windFieldDimensions = new Cesium.Cartesian3(data.dimensions.lon, data.dimensions.lat, data.dimensions.lev);

        var windFieldSteps = new Cesium.Cartesian3();
        windFieldSteps.x = (data.lon.max - data.lon.min) / data.lon.array.length;
        windFieldSteps.y = (data.lat.max - data.lat.min) / data.lat.array.length;
        windFieldSteps.z = (data.lev.max - data.lev.min) / data.lev.array.length;

        var uniformMap = {
            U: function () {
                return U;
            },
            V: function () {
                return V;
            },
            windFieldDimensions: function () {
                return windFieldDimensions;
            },
            windFieldSteps: function () {
                return windFieldSteps;
            },
            particles: function () {
                return fromParticles._colorTextures[0];
            }
        }

        computePrimitive = new CustomPrimitive({
            geometry: fullscreenQuad,
            attributeLocations: attributeLocations,
            uniformMap: uniformMap,
            vertexShaderFilePath: 'glsl/fullscreen.vert',
            fragmentShaderFilePath: 'glsl/update.frag',
            framebuffer: particlesFramebuffer1
        });

        // redefine the update function for ping-pong render
        computePrimitive.update = function (frameState) {
            if (!this.show) {
                return;
            }

            if (!Cesium.defined(this._command)) {
                this._command = this._createCommand(frameState.context);
            }

            if (Cesium.defined(this._command)) {
                frameState.commandList.push(this._command);

                // swap framebuffers
                var temp;
                temp = fromParticles;
                fromParticles = toParticles;
                toParticles = temp;

                this._command._framebuffer = toParticles;
            }
        }
    }

    var initParticlePointPrimitive = function () {
        var particleTextureSize = data.particles.textureSize;
        var particleIndex = [];

        for (var s = 0; s < particleTextureSize; s++) {
            for (var t = 0; t < particleTextureSize; t++) {
                particleIndex.push(s / particleTextureSize);
                particleIndex.push(t / particleTextureSize);
            }
        }
        particleIndex = new Float32Array(particleIndex);

        particlePoints = new Cesium.Geometry({
            attributes: new Cesium.GeometryAttributes({
                st: new Cesium.GeometryAttribute({
                    componentDatatype: Cesium.ComponentDatatype.FLOAT,
                    componentsPerAttribute: 2,
                    values: particleIndex
                })
            }),
            primitiveType: Cesium.PrimitiveType.POINTS
        });

        var attributeLocations = {
            st: 0
        };

        var uniformMap = {
            particles: function () {
                return fromParticles._colorTextures[0];
            }
        };

        particlePointsPrimitive = new CustomPrimitive({
            geometry: particlePoints,
            attributeLocations: attributeLocations,
            uniformMap: uniformMap,
            vertexShaderFilePath: 'glsl/pointDraw.vert',
            fragmentShaderFilePath: 'glsl/pointDraw.frag',
            framebuffer: undefined
        });
    }

    var init = function (cesiumContext, windData) {
        context = cesiumContext;
        data = windData;

        setupTextures();
        setupFramebuffers();
        initComputePrimitive();
        initParticlePointPrimitive();

        Util.debug();

        return {
            computePrimitive: computePrimitive,
            particlePointsPrimitive: particlePointsPrimitive
        };
    }

    return {
        init: init
    }

})();
