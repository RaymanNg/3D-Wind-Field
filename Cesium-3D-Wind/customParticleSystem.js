var ParticleSystem = (function () {
    var data;
    var context;
    var particleTextureSize;

    /** @type {Cesium.Texture} */var U;
    /** @type {Cesium.Texture} */var V;
    /** @type {Cesium.Texture} */var particlesTexture0;
    /** @type {Cesium.Texture} */var particlesTexture1;
    /** @type {Cesium.Framebuffer} */var particlesFramebuffer0;
    /** @type {Cesium.Framebuffer} */var particlesFramebuffer1;
    // used for ping-pong render
    var fromParticles;
    var toParticles;
    /** @type {Cesium.Geometry} */var fullscreenQuad;
    /** @type {CustomPrimitive} */var computePrimitive;

    /** @type {Cesium.Texture} */var pointsColorTexture;
    /** @type {Cesium.Texture} */var pointsDepthTexture;
    /** @type {Cesium.Framebuffer} */var pointsFramebuffer;
    /** @type {Cesium.Geometry} */var particlePoints;
    /** @type {CustomPrimitive} */var particlePointsPrimitive;

    /** @type {Cesium.Texture} */var trailsColorTexture0;
    /** @type {Cesium.Texture} */var trailsColorTexture1;
    /** @type {Cesium.Texture} */var trailsDepthTexture0;
    /** @type {Cesium.Texture} */var trailsDepthTexture1;
    /** @type {Cesium.Framebuffer} */var trailsFramebuffer0;
    /** @type {Cesium.Framebuffer} */var trailsFramebuffer1;
    // used for ping-pong render
    var currentTrails;
    var nextTrails;
    /** @type {CustomPrimitive} */var particleTrailsPrimitive;

    /** @type {CustomPrimitive} */var screenPrimitive;

    var setupGeometries = function () {
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

        U = createTexture(uvTextureOptions, data.U.array);
        V = createTexture(uvTextureOptions, data.V.array);

        const particlesTextureOptions = {
            context: context,
            width: data.particles.textureSize,
            height: data.particles.textureSize,
            pixelFormat: Cesium.PixelFormat.RGB,
            pixelDatatype: Cesium.PixelDatatype.FLOAT,
            flipY: false,
            sampler: dataTextureSampler
        };

        particlesTexture0 = createTexture(particlesTextureOptions, data.particles.array);
        particlesTexture1 = createTexture(particlesTextureOptions, data.particles.array);

        const colorTextureOptions = {
            context: context,
            width: context.drawingBufferWidth,
            height: context.drawingBufferHeight,
            pixelFormat: Cesium.PixelFormat.RGBA,
            pixelDatatype: Cesium.PixelDatatype.UNSIGNED_BYTE,
            sampler: dataTextureSampler
        }

        const depthTextureOptions = {
            context: context,
            width: context.drawingBufferWidth,
            height: context.drawingBufferHeight,
            pixelFormat: Cesium.PixelFormat.DEPTH_COMPONENT,
            pixelDatatype: Cesium.PixelDatatype.UNSIGNED_SHORT,
            sampler: dataTextureSampler
        }

        pointsColorTexture = createTexture(colorTextureOptions);
        pointsDepthTexture = createTexture(depthTextureOptions);

        trailsColorTexture0 = createTexture(colorTextureOptions);
        trailsColorTexture1 = createTexture(colorTextureOptions);

        trailsDepthTexture0 = createTexture(depthTextureOptions);
        trailsDepthTexture1 = createTexture(depthTextureOptions);
    }

    var createFramebuffer = function (colorTexture, depthTexture) {
        var framebuffer = new Cesium.Framebuffer({
            context: context,
            colorTextures: [colorTexture],
            depthTexture: depthTexture
        });
        return framebuffer;
    }

    var setupFramebuffers = function () {
        particlesFramebuffer0 = createFramebuffer(particlesTexture0);
        particlesFramebuffer1 = createFramebuffer(particlesTexture1);

        fromParticles = particlesFramebuffer0;
        toParticles = particlesFramebuffer1;

        pointsFramebuffer = createFramebuffer(pointsColorTexture, pointsDepthTexture);

        trailsFramebuffer0 = createFramebuffer(trailsColorTexture0, trailsDepthTexture0);
        trailsFramebuffer1 = createFramebuffer(trailsColorTexture1, trailsDepthTexture1);

        currentTrails = trailsFramebuffer0;
        nextTrails = trailsFramebuffer1;
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
                return fromParticles.getColorTexture(0);
            }
        }

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

            this._drawCommand._framebuffer = toParticles;
        }
    }

    var initParticlePointPrimitive = function () {
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
                return fromParticles.getColorTexture(0);
            }
        };

        var rawRenderState = createRawRenderState({
            // undefined value means let Cesium deal with it
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
            framebuffer: pointsFramebuffer
        });

        var clearCommand = new Cesium.ClearCommand({
            color: new Cesium.Color(0.0, 0.0, 0.0, 0.0),
            framebuffer: pointsFramebuffer,
            renderState: Cesium.RenderState.fromCache(rawRenderState)
        });

        particlePointsPrimitive.preExecute = function () {
            clearCommand.execute(context);
        };
    }

    var initParticleTrailsPrimitive = function () {
        var attributeLocations = {
            position: 0,
            st: 1
        };

        var uniformMap = {
            particlePointsColor: function () {
                return pointsColorTexture;
            },
            pointsDepthTexture: function () {
                return pointsDepthTexture;
            },
            currentTrailsColor: function () {
                return currentTrails.getColorTexture(0);
            },
            trailsDepthTexture: function () {
                return currentTrails.depthTexture;
            },
            fadeOpacity: function () {
                return data.particles.fadeOpacity;
            }
        };

        var rawRenderState = createRawRenderState({
            viewport: undefined,
            depthTestEnabled: true
        });

        particleTrailsPrimitive = new CustomPrimitive({
            geometry: fullscreenQuad,
            attributeLocations: attributeLocations,
            primitiveType: Cesium.PrimitiveType.TRIANGLES,
            uniformMap: uniformMap,
            vertexShaderFilePath: 'glsl/fullscreen.vert',
            fragmentShaderFilePath: 'glsl/trailDraw.frag',
            rawRenderState: rawRenderState,
            framebuffer: nextTrails
        });

        var clearCommand = new Cesium.ClearCommand({
            color: new Cesium.Color(0.0, 0.0, 0.0, 0.0),
            depth: 1.0,
            framebuffer: undefined,
            renderState: Cesium.RenderState.fromCache(rawRenderState)
        });

        // clear framebuffer at initialization
        clearCommand.framebuffer = currentTrails;
        clearCommand.execute(context);
        clearCommand.framebuffer = nextTrails;
        clearCommand.execute(context);

        // redefine the preExecute function for ping-pong trails render
        particleTrailsPrimitive.preExecute = function () {
            var temp;
            temp = currentTrails;
            currentTrails = nextTrails;
            nextTrails = temp;

            this._drawCommand._framebuffer = nextTrails;

            clearCommand.framebuffer = nextTrails;
            clearCommand.execute(context);
        }
    }

    var initScreenPrimitive = function () {
        var attributeLocations = {
            position: 0,
            st: 1
        };

        var uniformMap = {
            screenColor: function () {
                return pointsFramebuffer.getColorTexture(0);
            },
            screenDepth: function () {
                return pointsFramebuffer.depthTexture;
            }
        };

        var rawRenderState = createRawRenderState({
            viewport: undefined,
            depthTestEnabled: true
        });

        screenPrimitive = new CustomPrimitive({
            geometry: fullscreenQuad,
            attributeLocations: attributeLocations,
            primitiveType: Cesium.PrimitiveType.TRIANGLES,
            uniformMap: uniformMap,
            vertexShaderFilePath: 'glsl/fullscreen.vert',
            fragmentShaderFilePath: 'glsl/screenDraw.frag',
            rawRenderState: rawRenderState,
            framebuffer: undefined // undefined value means let Cesium deal with it
        });
    }

    var init = function (cesiumContext, windData) {
        context = cesiumContext;
        data = windData;
        particleTextureSize = data.particles.textureSize;

        setupGeometries();
        setupTextures();
        setupFramebuffers();

        initComputePrimitive();
        initParticlePointPrimitive();
        initParticleTrailsPrimitive();
        initScreenPrimitive();

        return {
            computePrimitive: computePrimitive,
            particlePointsPrimitive: particlePointsPrimitive,
            particleTrailsPrimitive: particleTrailsPrimitive,
            screenPrimitive: screenPrimitive
        };
    }

    return {
        init: init
    }

})();
