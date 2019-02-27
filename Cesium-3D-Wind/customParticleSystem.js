var ParticleSystem = (function () {
    var data;
    var context;

    /** @type {Cesium.Texture} */var U;
    /** @type {Cesium.Texture} */var V;

    /** @type {Cesium.Geometry} */var fullscreenQuad;
    /** @type {Cesium.Primitive} */var computePrimitive;

    /** @type {Cesium.Texture} */var particlesTexture0;
    /** @type {Cesium.Texture} */var particlesTexture1;

    /** @type {Cesium.Framebuffer} */var particlesFramebuffer0;
    /** @type {Cesium.Framebuffer} */var particlesFramebuffer1;

    // used for ping-pong render
    var fromParticles;
    var toParticles;

    /** @type {Cesium.Geometry} */var particlePoints;
    /** @type {Cesium.Primitive} */var particlePointsPrimitive;

    /** @type {Cesium.Texture} */var trailsTexture0;
    /** @type {Cesium.Texture} */var trailsTexture1;

    /** @type {Cesium.Framebuffer} */var trailsFramebuffer0;
    /** @type {Cesium.Framebuffer} */var trailsFramebuffer1;

    // used for ping-pong render
    var currentTrails;
    var nextTrails;

    /** @type {Cesium.Primitive} */var particleTrailsPrimitive;

    var createDataTexture = function (options, typedArray) {
        // typed array needs to be passed as source option, this is required by Cesium.Texture
        var source = {};
        source.arrayBufferView = typedArray;
        options.source = source;

        var texture = new Cesium.Texture(options);
        return texture;
    }

    var setupTextures = function () {
        const dataTextureSampler = new Cesium.Sampler({
            // the values of data texture should not be interpolated
            minificationFilter: Cesium.TextureMinificationFilter.NEAREST,
            magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST
        });

        const uvTextureOptions = {
            context: context,
            width: data.dimensions.lon,
            height: data.dimensions.lat * data.dimensions.lev,
            pixelFormat: Cesium.PixelFormat.LUMINANCE,
            pixelDatatype: Cesium.PixelDatatype.FLOAT,
            flipY: false, // data texture is not image, no need to flipY
            sampler: dataTextureSampler
        };

        U = createDataTexture(uvTextureOptions, data.U.array);
        V = createDataTexture(uvTextureOptions, data.V.array);

        const particlesTextureOptions = {
            context: context,
            width: data.particles.textureSize,
            height: data.particles.textureSize,
            pixelFormat: Cesium.PixelFormat.RGB,
            pixelDatatype: Cesium.PixelDatatype.FLOAT,
            sampler: dataTextureSampler
        };

        particlesTexture0 = createDataTexture(particlesTextureOptions, data.particles.array);
        particlesTexture1 = createDataTexture(particlesTextureOptions, data.particles.array);
    }

    var createFramebuffer = function (colorTexture) {
        var framebuffer = new Cesium.Framebuffer({
            context: context,
            colorTextures: [colorTexture]
        });
        return framebuffer;
    }

    var setupFramebuffers = function () {
        particlesFramebuffer0 = createFramebuffer(particlesTexture0, data.particles.textureSize, data.particles.textureSize);
        particlesFramebuffer1 = createFramebuffer(particlesTexture1, data.particles.textureSize, data.particles.textureSize);

        fromParticles = particlesFramebuffer0;
        toParticles = particlesFramebuffer1;
    }

    var createRawRenderState = function (options) {
        var translucent = true;
        var closed = false;
        var existing = {
            viewport: options.viewport
        };

        var rawRenderState = Cesium.Appearance.getDefaultRenderState(translucent, closed, existing);
        rawRenderState.depthTest.enabled = options.depthTestEnabled;
        return rawRenderState;
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
            indices: new Uint32Array([3, 2, 0, 0, 2, 1])
        });

        var attributeLocations = {
            position: 0,
            st: 1
        };

        var dimension = new Cesium.Cartesian3(data.dimensions.lon, data.dimensions.lat, data.dimensions.lev);
        var minimum = new Cesium.Cartesian3(data.lon.min, data.lat.min, data.lev.min);
        var maximum = new Cesium.Cartesian3(data.lon.max, data.lat.max, data.lev.max);
        var interval = new Cesium.Cartesian3(
            (maximum.x - minimum.x) / dimension.x,
            (maximum.y - minimum.y) / dimension.y,
            (maximum.z - minimum.z) / dimension.z
        );

        var uniformMap = {
            dimension: function () {
                return dimension;
            },
            minimum: function () {
                return minimum;
            },
            maximum: function () {
                return maximum;
            },
            interval: function () {
                return interval;
            },
            U: function () {
                return U;
            },
            V: function () {
                return V;
            },
            particles: function () {
                return fromParticles._colorTextures[0];
            }
        }

        var particleTextureSize = data.particles.textureSize;

        var rawRenderState = createRawRenderState({
            viewport: new Cesium.BoundingRectangle(0, 0, particleTextureSize, particleTextureSize),
            depthTestEnabled: false
        });

        computePrimitive = new CustomPrimitive({
            geometry: fullscreenQuad,
            attributeLocations: attributeLocations,
            primitiveType: Cesium.PrimitiveType.TRIANGLES,
            uniformMap: uniformMap,
            vertexShaderFilePath: 'glsl/fullscreen.vert',
            fragmentShaderFilePath: 'glsl/update.frag',
            rawRenderState: rawRenderState,
            framebuffer: particlesFramebuffer1
        });

        // redefine the preExecute function for ping-pong particles computation
        computePrimitive.preExecute = function () {
            // swap framebuffers before binding framebuffer
            var temp;
            temp = fromParticles;
            fromParticles = toParticles;
            toParticles = temp;

            this._command._framebuffer = toParticles;
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
            })
        });

        var attributeLocations = {
            st: 0
        };

        var uniformMap = {
            particles: function () {
                return fromParticles._colorTextures[0];
            }
        };

        var rawRenderState = createRawRenderState({
            // undefined values means let Cesium deal with it
            viewport: undefined,
            depthTestEnabled: true
        });

        particlePointsPrimitive = new CustomPrimitive({
            geometry: particlePoints,
            attributeLocations: attributeLocations,
            primitiveType: Cesium.PrimitiveType.POINTS,
            uniformMap: uniformMap,
            vertexShaderFilePath: 'glsl/pointDraw.vert',
            fragmentShaderFilePath: 'glsl/pointDraw.frag',
            rawRenderState: rawRenderState,
            // undefined values means let Cesium deal with it
            framebuffer: undefined
        });
    }

    var initParticleTrailsPrimitive = function () {

    }

    var init = function (cesiumContext, windData) {
        context = cesiumContext;
        data = windData;

        setupTextures();
        setupFramebuffers();

        initComputePrimitive();
        initParticlePointPrimitive();
        initParticleTrailsPrimitive();

        return {
            computePrimitive: computePrimitive,
            particlePointsPrimitive: particlePointsPrimitive
        };
    }

    return {
        init: init
    }

})();
