class ParticleSystem {
    constructor(cesiumContext, windData, particleSystemOptions, viewerParameters) {
        this.context = cesiumContext;
        this.data = windData;

        this.particleSystemOptions = particleSystemOptions;
        this.particleSystemOptions.particlesTextureSize = Math.ceil(Math.sqrt(this.particleSystemOptions.maxParticles));
        this.particlesArray = DataProcess.randomizeParticleLonLatLev(this.particleSystemOptions.maxParticles, viewerParameters.lonLatRange);

        this.clearCommand = new Cesium.ClearCommand({
            color: new Cesium.Color(0.0, 0.0, 0.0, 0.0),
            depth: 1.0,
            framebuffer: undefined
        });

        this.setupUnifromValues(viewerParameters.pixelSize);
        this.setupDataTextures();
        this.setupParticlesTextures(this.particlesArray);
        this.setupOutputFramebuffers();

        this.initComputePrimitive();
        this.initParticlePointPrimitive();
        this.initParticleTrailsPrimitive();
        this.initScreenPrimitive();
    }

    setupUnifromValues(pixelSize) {
        this.uniformValues = {};
        this.uniformValues.lonRange = new Cesium.Cartesian2(0.0, 360.0);
        this.uniformValues.latRange = new Cesium.Cartesian2(-90.0, 90.0);
        this.uniformValues.relativeSpeedRange = new Cesium.Cartesian2(
            this.particleSystemOptions.uvMinFactor * pixelSize,
            this.particleSystemOptions.uvMaxFactor * pixelSize
        );
    }

    setupDataTextures() {
        const uvTextureOptions = {
            context: this.context,
            width: this.data.dimensions.lon,
            height: this.data.dimensions.lat * this.data.dimensions.lev,
            pixelFormat: Cesium.PixelFormat.LUMINANCE,
            pixelDatatype: Cesium.PixelDatatype.FLOAT,
            flipY: false, // the data we provide should not be flipped
            sampler: new Cesium.Sampler({
                // the values of data texture should not be interpolated
                minificationFilter: Cesium.TextureMinificationFilter.NEAREST,
                magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST
            })
        };

        this.uniformValues.U = Util.createTexture(uvTextureOptions, this.data.U.array);
        this.uniformValues.V = Util.createTexture(uvTextureOptions, this.data.V.array);

        const colorTableTextureOptions = {
            context: this.context,
            width: this.data.colorTable.colorNum,
            height: 1,
            pixelFormat: Cesium.PixelFormat.RGB,
            pixelDatatype: Cesium.PixelDatatype.FLOAT,
            sampler: new Cesium.Sampler({
                minificationFilter: Cesium.TextureMinificationFilter.LINEAR,
                magnificationFilter: Cesium.TextureMagnificationFilter.LINEAR
            })
        }
        this.uniformValues.colorTable = Util.createTexture(colorTableTextureOptions, this.data.colorTable.array);
    }

    setupParticlesTextures() {
        const particlesTextureOptions = {
            context: this.context,
            width: this.particleSystemOptions.particlesTextureSize,
            height: this.particleSystemOptions.particlesTextureSize,
            pixelFormat: Cesium.PixelFormat.RGB,
            pixelDatatype: Cesium.PixelDatatype.FLOAT,
            sampler: new Cesium.Sampler({
                // the values of particles texture should not be interpolated
                minificationFilter: Cesium.TextureMinificationFilter.NEAREST,
                magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST
            })
        };

        var particlesTexture0 = Util.createTexture(particlesTextureOptions, this.particlesArray);
        var particlesTexture1 = Util.createTexture(particlesTextureOptions, this.particlesArray);

        // used for ping-pong render
        this.fromParticles = particlesTexture0;
        this.toParticles = particlesTexture1;
    }

    setupOutputFramebuffers() {
        const colorTextureOptions = {
            context: this.context,
            width: this.context.drawingBufferWidth,
            height: this.context.drawingBufferHeight,
            pixelFormat: Cesium.PixelFormat.RGBA,
            pixelDatatype: Cesium.PixelDatatype.UNSIGNED_BYTE
        }

        const depthTextureOptions = {
            context: this.context,
            width: this.context.drawingBufferWidth,
            height: this.context.drawingBufferHeight,
            pixelFormat: Cesium.PixelFormat.DEPTH_COMPONENT,
            pixelDatatype: Cesium.PixelDatatype.UNSIGNED_INT
        }

        var pointsColorTexture = Util.createTexture(colorTextureOptions);
        var pointsDepthTexture = Util.createTexture(depthTextureOptions);
        this.pointsFramebuffer = Util.createFramebuffer(this.context, pointsColorTexture, pointsDepthTexture);

        var trailsColorTexture0 = Util.createTexture(colorTextureOptions);
        var trailsDepthTexture0 = Util.createTexture(depthTextureOptions);
        var trailsFramebuffer0 = Util.createFramebuffer(this.context, trailsColorTexture0, trailsDepthTexture0);

        var trailsColorTexture1 = Util.createTexture(colorTextureOptions);
        var trailsDepthTexture1 = Util.createTexture(depthTextureOptions);
        var trailsFramebuffer1 = Util.createFramebuffer(this.context, trailsColorTexture1, trailsDepthTexture1);

        // used for ping-pong render
        this.currentTrails = trailsFramebuffer0;
        this.nextTrails = trailsFramebuffer1;
    }

    initComputePrimitive() {
        const attributeLocations = {
            position: 0,
            st: 1
        };

        const minimum = new Cesium.Cartesian3(this.data.lon.min, this.data.lat.min, this.data.lev.min);
        const maximum = new Cesium.Cartesian3(this.data.lon.max, this.data.lat.max, this.data.lev.max);
        const dimension = new Cesium.Cartesian3(
            this.data.dimensions.lon,
            this.data.dimensions.lat,
            this.data.dimensions.lev
        );
        const interval = new Cesium.Cartesian3(
            (maximum.x - minimum.x) / (dimension.x - 1),
            (maximum.y - minimum.y) / (dimension.y - 1),
            (maximum.z - minimum.z) / (dimension.z - 1)
        );
        const uSpeedRange = new Cesium.Cartesian3(
            this.data.U.min,
            this.data.U.max,
            this.data.U.max - this.data.U.min
        );
        const vSpeedRange = new Cesium.Cartesian3(
            this.data.V.min,
            this.data.V.max,
            this.data.V.max - this.data.V.min
        );

        const that = this;
        const uniformMap = {
            U: function () {
                return that.uniformValues.U;
            },
            V: function () {
                return that.uniformValues.V;
            },
            particles: function () {
                return that.fromParticles;
            },
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
            uSpeedRange: function () {
                return uSpeedRange;
            },
            vSpeedRange: function () {
                return vSpeedRange;
            },
            relativeSpeedRange: function () {
                return that.uniformValues.relativeSpeedRange;
            },
            lonRange: function () {
                return that.uniformValues.lonRange;
            },
            latRange: function () {
                return that.uniformValues.latRange;
            },
            dropRate: function () {
                return that.particleSystemOptions.dropRate;
            },
            dropRateBump: function () {
                return that.particleSystemOptions.dropRateBump;
            }
        }

        const rawRenderState = Util.createRawRenderState({
            viewport: new Cesium.BoundingRectangle(0, 0,
                this.particleSystemOptions.particlesTextureSize, this.particleSystemOptions.particlesTextureSize),
            depthTest: {
                enabled: false
            }
        });

        const vertexShaderSource = new Cesium.ShaderSource({
            sources: [Util.loadText('glsl/fullscreen.vert')]
        });

        const fragmentShaderSource = new Cesium.ShaderSource({
            sources: [Util.loadText('glsl/update.frag')]
        });

        this.computePrimitive = new CustomPrimitive({
            commandType: 'Compute',
            geometry: Util.getFullscreenQuad(),
            attributeLocations: attributeLocations,
            primitiveType: Cesium.PrimitiveType.TRIANGLES,
            uniformMap: uniformMap,
            vertexShaderSource: vertexShaderSource,
            fragmentShaderSource: fragmentShaderSource,
            rawRenderState: rawRenderState,
            outputTexture: this.toParticles
        });

        // redefine the preExecute function for ping-pong particles computation
        this.computePrimitive.preExecute = function () {
            // swap framebuffers before binding framebuffer
            var temp;
            temp = that.fromParticles;
            that.fromParticles = that.toParticles;
            that.toParticles = temp;

            this.commandToExecute.outputTexture = that.toParticles;
        }
    }

    initParticlePointPrimitive() {
        var particleIndex = [];

        for (var s = 0; s < this.particleSystemOptions.particlesTextureSize; s++) {
            for (var t = 0; t < this.particleSystemOptions.particlesTextureSize; t++) {
                for (var i = 0; i < 2; i++) {
                    particleIndex.push(s / this.particleSystemOptions.particlesTextureSize);
                    particleIndex.push(t / this.particleSystemOptions.particlesTextureSize);
                    particleIndex.push(i); // use i to distinguish indexes of fromParticles and toParticles
                }
            }
        }
        particleIndex = new Float32Array(particleIndex);

        const particlePoints = new Cesium.Geometry({
            attributes: new Cesium.GeometryAttributes({
                position: new Cesium.GeometryAttribute({
                    componentDatatype: Cesium.ComponentDatatype.FLOAT,
                    componentsPerAttribute: 3,
                    values: particleIndex
                })
            })
        });

        const attributeLocations = {
            position: 0
        };

        const that = this;
        const uniformMap = {
            fromParticles: function () {
                return that.fromParticles;
            },
            toParticles: function () {
                return that.toParticles;
            },
            colorTable: function () {
                return that.uniformValues.colorTable;
            }
        };

        const rawRenderState = Util.createRawRenderState({
            // undefined value means let Cesium deal with it
            viewport: undefined,
            depthTest: {
                enabled: true
            },
            depthMask: true
        });

        const vertexShaderSource = new Cesium.ShaderSource({
            sources: [Util.loadText('glsl/pointDraw.vert')]
        });

        const fragmentShaderSource = new Cesium.ShaderSource({
            sources: [Util.loadText('glsl/pointDraw.frag')]
        });

        this.particlePointsPrimitive = new CustomPrimitive({
            geometry: particlePoints,
            attributeLocations: attributeLocations,
            primitiveType: Cesium.PrimitiveType.LINES,
            uniformMap: uniformMap,
            vertexShaderSource: vertexShaderSource,
            fragmentShaderSource: fragmentShaderSource,
            rawRenderState: rawRenderState,
            framebuffer: this.pointsFramebuffer,
            autoClear: true
        });
    }

    initParticleTrailsPrimitive() {
        const attributeLocations = {
            position: 0,
            st: 1
        };

        const that = this;
        const uniformMap = {
            particlePointsColor: function () {
                return that.pointsFramebuffer.getColorTexture(0);
            },
            pointsDepthTexture: function () {
                return that.pointsFramebuffer.depthTexture;
            },
            currentTrailsColor: function () {
                return that.currentTrails.getColorTexture(0);
            },
            trailsDepthTexture: function () {
                return that.currentTrails.depthTexture;
            },
            fadeOpacity: function () {
                return that.particleSystemOptions.fadeOpacity;
            }
        };

        const rawRenderState = Util.createRawRenderState({
            viewport: undefined,
            depthTest: {
                enabled: true,
                func: Cesium.DepthFunction.ALWAYS // always pass depth test for the full control of depth information
            },
            depthMask: true
        });

        // prevent Cesium from writing depth because the depth here should be written manually
        const vertexShaderSource = new Cesium.ShaderSource({
            defines: ['DISABLE_GL_POSITION_LOG_DEPTH'],
            sources: [Util.loadText('glsl/fullscreen.vert')]
        });

        const fragmentShaderSource = new Cesium.ShaderSource({
            defines: ['DISABLE_LOG_DEPTH_FRAGMENT_WRITE'],
            sources: [Util.loadText('glsl/trailDraw.frag')]
        });

        this.particleTrailsPrimitive = new CustomPrimitive({
            geometry: Util.getFullscreenQuad(),
            attributeLocations: attributeLocations,
            primitiveType: Cesium.PrimitiveType.TRIANGLES,
            uniformMap: uniformMap,
            vertexShaderSource: vertexShaderSource,
            fragmentShaderSource: fragmentShaderSource,
            rawRenderState: rawRenderState,
            framebuffer: this.nextTrails,
            autoClear: true
        });

        // redefine the preExecute function for ping-pong trails render
        this.particleTrailsPrimitive.preExecute = function () {
            var temp;
            temp = that.currentTrails;
            that.currentTrails = that.nextTrails;
            that.nextTrails = temp;

            this.commandToExecute.framebuffer = that.nextTrails;
            this.clearCommand.framebuffer = that.nextTrails;
        }
    }

    initScreenPrimitive() {
        const attributeLocations = {
            position: 0,
            st: 1
        };

        const that = this;
        const uniformMap = {
            trailsColorTexture: function () {
                return that.nextTrails.getColorTexture(0);
            },
            trailsDepthTexture: function () {
                return that.nextTrails.depthTexture;
            }
        };

        const rawRenderState = Util.createRawRenderState({
            viewport: undefined,
            depthTest: {
                enabled: false
            },
            depthMask: true,
            blending: {
                enabled: true
            }
        });

        // prevent Cesium from writing depth because the depth here should be written manually
        const vertexShaderSource = new Cesium.ShaderSource({
            defines: ['DISABLE_GL_POSITION_LOG_DEPTH'],
            sources: [Util.loadText('glsl/fullscreen.vert')]
        });

        const fragmentShaderSource = new Cesium.ShaderSource({
            defines: ['DISABLE_LOG_DEPTH_FRAGMENT_WRITE'],
            sources: [Util.loadText('glsl/screenDraw.frag')]
        });

        this.screenPrimitive = new CustomPrimitive({
            geometry: Util.getFullscreenQuad(),
            attributeLocations: attributeLocations,
            primitiveType: Cesium.PrimitiveType.TRIANGLES,
            uniformMap: uniformMap,
            vertexShaderSource: vertexShaderSource,
            fragmentShaderSource: fragmentShaderSource,
            rawRenderState: rawRenderState,
            framebuffer: undefined // undefined value means let Cesium deal with it
        });
    }

    clearFramebuffer() {
        this.clearCommand.framebuffer = this.pointsFramebuffer;
        this.clearCommand.execute(this.context);

        this.clearCommand.framebuffer = this.currentTrails;
        this.clearCommand.execute(this.context);
        this.clearCommand.framebuffer = this.nextTrails;
        this.clearCommand.execute(this.context);
    }

    refreshParticle(viewerParameters) {
        this.clearFramebuffer();

        var lonLatRange = viewerParameters.lonLatRange;
        this.uniformValues.lonRange.x = lonLatRange.lon.min;
        this.uniformValues.lonRange.y = lonLatRange.lon.max;
        this.uniformValues.latRange.x = lonLatRange.lat.min;
        this.uniformValues.latRange.y = lonLatRange.lat.max;

        var pixelSize = viewerParameters.pixelSize;
        this.uniformValues.relativeSpeedRange.x = this.particleSystemOptions.uvMinFactor * pixelSize;
        this.uniformValues.relativeSpeedRange.y = this.particleSystemOptions.uvMaxFactor * pixelSize;

        this.particlesArray = DataProcess.randomizeParticleLonLatLev(this.particleSystemOptions.maxParticles, lonLatRange);

        this.fromParticles.destroy();
        this.toParticles.destroy();
        this.setupParticlesTextures();
    }

    canvasResize(cesiumContext) {
        this.fromParticles.destroy();
        this.toParticles.destroy();
        this.pointsFramebuffer.destroy();
        this.currentTrails.destroy();
        this.nextTrails.destroy();

        this.context = cesiumContext;
        this.setupDataTextures();
        this.setupParticlesTextures();
        this.setupOutputFramebuffers();

        this.computePrimitive.commandToExecute.outputTexture = this.toParticles;
        this.particlePointsPrimitive.clearCommand.framebuffer = this.pointsFramebuffer;
        this.particlePointsPrimitive.commandToExecute.framebuffer = this.pointsFramebuffer;
        this.particleTrailsPrimitive.clearCommand.framebuffer = this.nextTrails;
        this.particleTrailsPrimitive.commandToExecute.framebuffer = this.nextTrails;
    }
}