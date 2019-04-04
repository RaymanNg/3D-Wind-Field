class Wind3D {
    constructor(fileOptions, particleSystemOptions, mode) {
        var options = {
            baseLayerPicker: false,
            geocoder: false,
            infoBox: false,
            fullscreenElement: 'cesiumContainer',
            scene3DOnly: true
        }

        if (mode.debug) {
            options.useDefaultRenderLoop = false;
        }
        if (mode.offline) {
            options.imageryProvider = Cesium.createTileMapServiceImageryProvider({
                url: Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
            });
        } else {
            options.terrainProvider = Cesium.createWorldTerrain();
        }

        this.viewer = new Cesium.Viewer('cesiumContainer', options);
        this.scene = this.viewer.scene;
        this.camera = this.viewer.camera;

        // use a smaller earth radius to make sure distance to camera > 0
        this.globeBoundingSphere = new Cesium.BoundingSphere(Cesium.Cartesian3.ZERO, 0.99 * 6378137.0);
        this.viewerParameters = {};
        this.updateViewerParameters();

        DataProcess.loadData(fileOptions).then(
            (windData) => {
                this.particleSystem = new ParticleSystem(this.scene.context, windData,
                    particleSystemOptions, fileOptions, this.viewerParameters);

                // the order of primitives.add should respect the dependency of primitives
                this.scene.primitives.add(this.particleSystem.primitives.particlesUpdate);
                this.scene.primitives.add(this.particleSystem.primitives.particlesRandomize);
                this.scene.primitives.add(this.particleSystem.primitives.segments);
                this.scene.primitives.add(this.particleSystem.primitives.trails);
                this.scene.primitives.add(this.particleSystem.primitives.screen);

                this.setupEventListeners();

                if (mode.debug) {
                    this.debug();
                }
            });
    }

    updateViewerParameters() {
        var viewerParameters = {};

        var viewRectangle = this.camera.computeViewRectangle(this.scene.globe.ellipsoid);
        viewerParameters.lonLatRange = Util.viewRectangleToLonLatRange(viewRectangle);

        viewerParameters.pixelSize = this.camera.getPixelSize(
            this.globeBoundingSphere,
            this.scene.drawingBufferWidth,
            this.scene.drawingBufferHeight
        );

        if (viewerParameters.pixelSize == 0) {
            viewerParameters.pixelSize = this.viewerParameters.pixelSize;
        }

        this.viewerParameters = viewerParameters;
    }

    setupEventListeners() {
        const that = this;

        this.camera.moveStart.addEventListener(function () {
            that.scene.primitives.show = false;
        });

        this.camera.moveEnd.addEventListener(function () {
            that.updateViewerParameters();
            that.particleSystem.refreshParticle(that.viewerParameters, false);
            that.scene.primitives.show = true;
        });

        var resized = false;
        window.addEventListener("resize", function () {
            resized = true;
            that.scene.primitives.show = false;
        });

        this.scene.preRender.addEventListener(function () {
            if (resized) {
                that.particleSystem.canvasResize(that.scene.context);
                resized = false;
                that.scene.primitives.show = true;
            }
        });

        window.addEventListener('panelChanged', function (event) {
            that.particleSystem.applyParticleSystemOptions(event.detail);
        });
    }

    debug() {
        const that = this;

        var animate = function () {
            that.viewer.resize();
            that.viewer.render();
            requestAnimationFrame(animate);
        }

        var spector = new SPECTOR.Spector();
        spector.displayUI();
        spector.spyCanvases();

        animate();
    }
}
