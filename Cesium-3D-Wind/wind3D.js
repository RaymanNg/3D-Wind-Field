class Wind3D {
    constructor(fileOptions, particleSystemOptions) {
        this.viewer = new Cesium.Viewer('cesiumContainer', {
            fullscreenElement: 'cesiumContainer',
            scene3DOnly: true,
            terrainProvider: Cesium.createWorldTerrain()
        });
        this.scene = this.viewer.scene;
        this.camera = this.viewer.camera;

        // use a smaller earth radius to make sure distance to camera > 0
        this.globeBoundingSphere = new Cesium.BoundingSphere(Cesium.Cartesian3.ZERO, 0.99 * 6378137.0);
        var viewerParameters = this.getViewerParameters();

        DataProcess.loadData(fileOptions).then(
            (windData) => {
                this.particleSystem = new ParticleSystem(this.scene.context, windData, particleSystemOptions, viewerParameters);

                // the order of primitives.add should respect the dependency of primitives
                this.scene.primitives.add(this.particleSystem.primitives.compute);
                this.scene.primitives.add(this.particleSystem.primitives.segments);
                this.scene.primitives.add(this.particleSystem.primitives.trails);
                this.scene.primitives.add(this.particleSystem.primitives.screen);

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
