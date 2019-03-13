class Wind3D {
    constructor(filePath, particleSystemOptions) {
        this.viewer = new Cesium.Viewer('cesiumContainer', {
            scene3DOnly: true,
            fullscreenElement: 'cesiumContainer',
            terrainProvider: Cesium.createWorldTerrain(),
            baseLayerPicker: false
        });
        this.scene = this.viewer.scene;
        this.camera = this.viewer.camera;

        this.scene.screenSpaceCameraController.minimumZoomDistance = 10000.0;
        this.globeBoundingSphere = Cesium.BoundingSphere.fromEllipsoid(this.scene.globe.ellipsoid);

        var lonLatRange = this.getLonLatRange();
        var pixelSize = this.camera.getPixelSize(
            this.globeBoundingSphere,
            this.scene.drawingBufferWidth,
            this.scene.drawingBufferHeight
        );

        DataProcess.process(filePath, particleSystemOptions, lonLatRange).then(
            (data) => {
                this.particleSystem = new ParticleSystem(
                    this.scene.context, data,
                    particleSystemOptions, pixelSize
                );

                // the order of primitives.add should respect the dependency of primitives
                this.scene.primitives.add(this.particleSystem.computePrimitive);
                this.scene.primitives.add(this.particleSystem.particlePointsPrimitive);
                this.scene.primitives.add(this.particleSystem.particleTrailsPrimitive);
                this.scene.primitives.add(this.particleSystem.screenPrimitive);

                this.setupEventListener();
            });
    }

    getLonLatRange() {
        var viewRectangle = this.camera.computeViewRectangle(this.scene.globe.ellipsoid);
        var lonLatRange = Util.rectangleToLonLatRange(viewRectangle);
        return lonLatRange;
    }

    setupEventListener() {
        const that = this;

        this.camera.moveStart.addEventListener(function () {
            that.scene.primitives.show = false;
        });

        this.camera.moveEnd.addEventListener(function () {
            var lonLatRange = that.getLonLatRange();
            var pixelSize = that.camera.getPixelSize(
                that.globeBoundingSphere,
                that.scene.drawingBufferWidth,
                that.scene.drawingBufferHeight
            );
            that.particleSystem.refreshParticle(lonLatRange, pixelSize);
            that.scene.primitives.show = true;
        });

        resized = false;
        ow.addEventListener("resize", function () {
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
