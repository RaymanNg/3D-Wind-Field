class ParticleSystem {
    constructor(cesiumContext, windData,
        particleSystemOptions, pixelSize) {
        this.context = cesiumContext;
        this.data = windData;

        this.clearCommand = new Cesium.ClearCommand({
            color: new Cesium.Color(0.0, 0.0, 0.0, 0.0),
            depth: 1.0,
            framebuffer: undefined
        });

        this.particleSystemOptions = particleSystemOptions;
        this.setupUnifroms(pixelSize);

        this.setupAllTexturesAndFramebuffers(this.data);

        this.initComputePrimitive();
        this.initParticlePointPrimitive();
        this.initParticleTrailsPrimitive();
        this.initScreenPrimitive();
    }

    setupUnifroms(pixelSize) {
        this.lonRange = new Cesium.Cartesian2(0.0, 360.0);
        this.latRange = new Cesium.Cartesian2(-90.0, 90.0);
        this.relativeSpeedRange = new Cesium.Cartesian2(
            this.particleSystemOptions.uvMinFactor * pixelSize,
            this.particleSystemOptions.uvMaxFactor * pixelSize
        );
    }

    setupParticleTexturesAndFramebuffers(particlesTextureSize, particlesArray) {
        const particlesTextureOptions = {
            context: this.context,
            width: particlesTextureSize,
            height: particlesTextureSize,
            pixelFormat: Cesium.PixelFormat.RGBA,
            pixelDatatype: Cesium.PixelDatatype.FLOAT,
            flipY: false,
            sampler: Util.getDataTextureSampler()
        };

        this.particlesTexture0 = Util.createTexture(particlesTextureOptions, particlesArray);
        this.particlesTexture1 = Util.createTexture(particlesTextureOptions, particlesArray);

        this.particlesFramebuffer0 = Util.createFramebuffer(this.context, this.particlesTexture0);
        this.particlesFramebuffer1 = Util.createFramebuffer(this.context, this.particlesTexture1);

        // used for ping-pong render
        this.fromParticles = this.particlesFramebuffer0;
        this.toParticles = this.particlesFramebuffer1;
    }

    setupAllTexturesAndFramebuffers(data) {
        this.setupParticleTexturesAndFramebuffers(data.particles.textureSize, data.particles.array);

        const uvTextureOptions = {
            context: this.context,
            width: data.dimensions.lon,
            height: data.dimensions.lat * data.dimensions.lev,
            pixelFormat: Cesium.PixelFormat.LUMINANCE,
            pixelDatatype: Cesium.PixelDatatype.FLOAT,
            flipY: false, // the data we provide should not be flipped
            sampler: Util.getDataTextureSampler()
        };

        this.U = Util.createTexture(uvTextureOptions, data.U.array);
        this.V = Util.createTexture(uvTextureOptions, data.V.array);

        var colorRampData = DataProcess.loadColorRamp('data/colorRamp.json');
        const colorRampTextureOptions = {
            context: this.context,
            width: colorRampData.num,
            height: 1,
            pixelFormat: Cesium.PixelFormat.RGB,
            pixelDatatype: Cesium.PixelDatatype.FLOAT,
            sampler: new Cesium.Sampler({
                minificationFilter: Cesium.TextureMinificationFilter.LINEAR,
                magnificationFilter: Cesium.TextureMagnificationFilter.LINEAR
            })
        }
        this.colorRamp = Util.createTexture(colorRampTextureOptions, colorRampData.array);

        const colorTextureOptions = {
            context: this.context,
            width: this.context.drawingBufferWidth,
            height: this.context.drawingBufferHeight,
            pixelFormat: Cesium.PixelFormat.RGBA,
            pixelDatatype: Cesium.PixelDatatype.UNSIGNED_BYTE,
            sampler: Util.getDataTextureSampler()
        }

        const depthTextureOptions = {
            context: this.context,
            width: this.context.drawingBufferWidth,
            height: this.context.drawingBufferHeight,
            pixelFormat: Cesium.PixelFormat.DEPTH_COMPONENT,
            pixelDatatype: Cesium.PixelDatatype.UNSIGNED_INT,
            sampler: Util.getDataTextureSampler()
        }

        this.pointsColorTexture = Util.createTexture(colorTextureOptions);
        this.pointsDepthTexture = Util.createTexture(depthTextureOptions);

        this.trailsColorTexture0 = Util.createTexture(colorTextureOptions);
        this.trailsColorTexture1 = Util.createTexture(colorTextureOptions);

        this.trailsDepthTexture0 = Util.createTexture(depthTextureOptions);
        this.trailsDepthTexture1 = Util.createTexture(depthTextureOptions);

        this.pointsFramebuffer = Util.createFramebuffer(this.context, this.pointsColorTexture, this.pointsDepthTexture);

        this.trailsFramebuffer0 = Util.createFramebuffer(this.context, this.trailsColorTexture0, this.trailsDepthTexture0);
        this.trailsFramebuffer1 = Util.createFramebuffer(this.context, this.trailsColorTexture1, this.trailsDepthTexture1);

        // used for ping-pong render
        this.currentTrails = this.trailsFramebuffer0;
        this.nextTrails = this.trailsFramebuffer1;
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
                return that.U;
            },
            V: function () {
                return that.V;
            },
            particles: function () {
                return that.fromParticles.getColorTexture(0);
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
                return that.relativeSpeedRange;
            },
            lonRange: function () {
                return that.lonRange;
            },
            latRange: function () {
                return that.latRange;
            },
            dropRate: function () {
                return that.particleSystemOptions.dropRate;
            },
            dropRateBump: function () {
                return that.particleSystemOptions.dropRateBump;;
            }
        }

        const rawRenderState = Util.createRawRenderState({
            viewport: new Cesium.BoundingRectangle(0, 0,
                this.data.particles.textureSize, this.data.particles.textureSize),
            depthTest: {
                enabled: false
            }
        });

        const vertexShaderSource = new Cesium.ShaderSource({
            sources: [Util.getText('glsl/fullscreen.vert')]
        });

        const fragmentShaderSource = new Cesium.ShaderSource({
            sources: [Util.getText('glsl/update.frag')]
        });

        this.computePrimitive = new CustomPrimitive({
            geometry: Util.getFullscreenQuad(),
            attributeLocations: attributeLocations,
            primitiveType: Cesium.PrimitiveType.TRIANGLES,
            uniformMap: uniformMap,
            vertexShaderSource: vertexShaderSource,
            fragmentShaderSource: fragmentShaderSource,
            rawRenderState: rawRenderState,
            framebuffer: this.toParticles
        });

        // redefine the preExecute function for ping-pong particles computation
        this.computePrimitive.preExecute = function () {
            // swap framebuffers before binding framebuffer
            var temp;
            temp = that.fromParticles;
            that.fromParticles = that.toParticles;
            that.toParticles = temp;

            this._drawCommand.framebuffer = that.toParticles;
        }
    }

    initParticlePointPrimitive() {
        var particleIndex = [];

        for (var s = 0; s < this.data.particles.textureSize; s++) {
            for (var t = 0; t < this.data.particles.textureSize; t++) {
                particleIndex.push(s / this.data.particles.textureSize);
                particleIndex.push(t / this.data.particles.textureSize);
            }
        }
        particleIndex = new Float32Array(particleIndex);

        const particlePoints = new Cesium.Geometry({
            attributes: new Cesium.GeometryAttributes({
                st: new Cesium.GeometryAttribute({
                    componentDatatype: Cesium.ComponentDatatype.FLOAT,
                    componentsPerAttribute: 2,
                    values: particleIndex
                })
            })
        });

        const attributeLocations = {
            st: 0
        };

        const that = this;
        const uniformMap = {
            particles: function () {
                return that.toParticles.getColorTexture(0);
            },
            colorRamp: function () {
                return that.colorRamp;
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
            sources: [Util.getText('glsl/pointDraw.vert')]
        });

        const fragmentShaderSource = new Cesium.ShaderSource({
            sources: [Util.getText('glsl/pointDraw.frag')]
        });

        this.particlePointsPrimitive = new CustomPrimitive({
            geometry: particlePoints,
            attributeLocations: attributeLocations,
            primitiveType: Cesium.PrimitiveType.POINTS,
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
                return that.data.particles.fadeOpacity;
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
            sources: [Util.getText('glsl/fullscreen.vert')]
        });

        const fragmentShaderSource = new Cesium.ShaderSource({
            defines: ['DISABLE_LOG_DEPTH_FRAGMENT_WRITE'],
            sources: [Util.getText('glsl/trailDraw.frag')]
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

        // clear framebuffer at initialization
        this.clearCommand.framebuffer = this.currentTrails;
        this.clearCommand.execute(this.context);
        this.clearCommand.framebuffer = this.nextTrails;
        this.clearCommand.execute(this.context);

        // redefine the preExecute function for ping-pong trails render
        this.particleTrailsPrimitive.preExecute = function () {
            var temp;
            temp = that.currentTrails;
            that.currentTrails = that.nextTrails;
            that.nextTrails = temp;

            this._drawCommand.framebuffer = that.nextTrails;
            this._clearCommand.framebuffer = that.nextTrails;
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
            sources: [Util.getText('glsl/fullscreen.vert')]
        });

        const fragmentShaderSource = new Cesium.ShaderSource({
            defines: ['DISABLE_LOG_DEPTH_FRAGMENT_WRITE'],
            sources: [Util.getText('glsl/screenDraw.frag')]
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

    refreshParticle(lonLatRange, pixelSize) {
        this.clearFramebuffer();

        this.lonRange.x = lonLatRange.lon.min;
        this.lonRange.y = lonLatRange.lon.max;
        this.latRange.x = lonLatRange.lat.min;
        this.latRange.y = lonLatRange.lat.max;

        this.relativeSpeedRange.x = this.particleSystemOptions.uvMinFactor * pixelSize;
        this.relativeSpeedRange.y = this.particleSystemOptions.uvMaxFactor * pixelSize;

        var maxParticles = this.data.particles.textureSize * this.data.particles.textureSize;
        this.data.particles.array = DataProcess.randomizeParticle(maxParticles, lonLatRange);

        this.fromParticles.destroy();
        this.toParticles.destroy();
        this.setupParticleTexturesAndFramebuffers(this.data.particles.textureSize, this.data.particles.array);
    }

    canvasResize(cesiumContext) {
        this.fromParticles.destroy();
        this.toParticles.destroy();
        this.pointsFramebuffer.destroy();
        this.currentTrails.destroy();
        this.nextTrails.destroy();

        this.context = cesiumContext;
        this.setupAllTexturesAndFramebuffers(this.data);

        this.computePrimitive._drawCommand.framebuffer = this.toParticles;
        this.particlePointsPrimitive._clearCommand.framebuffer = this.pointsFramebuffer;
        this.particlePointsPrimitive._drawCommand.framebuffer = this.pointsFramebuffer;
        this.particleTrailsPrimitive._clearCommand.framebuffer = this.nextTrails;
        this.particleTrailsPrimitive._drawCommand.framebuffer = this.nextTrails;
    }
}