class Wind3D {
    constructor(fileOptions, particleSystemOptions) {
        this.viewer = new Cesium.Viewer('cesiumContainer', {
            scene3DOnly: true,
            fullscreenElement: 'cesiumContainer',
            terrainProvider: Cesium.createWorldTerrain(),
            baseLayerPicker: false
        });
        this.scene = this.viewer.scene;
        this.camera = this.viewer.camera;

        // use a smaller earth radius to make sure distance to camera > 0
        this.globeBoundingSphere = new Cesium.BoundingSphere(Cesium.Cartesian3.ZERO, 0.99 * 6378137.0);
        var viewerParameters = this.getViewerParameters();

        DataProcess.process(fileOptions, particleSystemOptions, viewerParameters.lonLatRange).then(
            (data) => {
                this.particleSystem = new ParticleSystem(
                    this.scene.context, data,
                    particleSystemOptions, viewerParameters
                );

                // the order of primitives.add should respect the dependency of primitives
                this.scene.primitives.add(this.particleSystem.computePrimitive);
                this.scene.primitives.add(this.particleSystem.particlePointsPrimitive);
                this.scene.primitives.add(this.particleSystem.particleTrailsPrimitive);
                this.scene.primitives.add(this.particleSystem.screenPrimitive);

                this.setupEventListeners();
            });
    }

    getViewerParameters() {
        var viewerParameters = {};

        var viewRectangle = this.camera.computeViewRectangle(this.scene.globe.ellipsoid);
        viewerParameters.lonLatRange = Util.viewRectangleToLonLatRange(viewRectangle);

        viewerParameters.pixelSize = this.camera.getPixelSize(
            this.globeBoundingSphere,
            this.scene.drawingBufferWidth,
            this.scene.drawingBufferHeight
        );

        return viewerParameters;
    }

    setupEventListeners() {
        const that = this;

        this.camera.moveStart.addEventListener(function () {
            that.scene.primitives.show = false;
        });

        this.camera.moveEnd.addEventListener(function () {
            var viewerParameters = that.getViewerParameters();
            that.particleSystem.refreshParticle(viewerParameters);
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
    }

    debug() {
        const that = this;

        var animate = function () {
            that.scene.render();
            requestAnimationFrame(animate);
        }

        var spector = new SPECTOR.Spector();
        spector.displayUI();
        spector.spyCanvases();

        animate();
    }
}
