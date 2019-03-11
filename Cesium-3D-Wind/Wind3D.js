class Wind3D {
    constructor(filePath, particleSystemOptions) {
        this.viewer = new Cesium.Viewer('cesiumContainer', {
            scene3DOnly: true,
            fullscreenElement: 'cesiumContainer',
            imageryProvider: Cesium.createTileMapServiceImageryProvider({
                url: Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
            }),
            baseLayerPicker: false,
            geocoder: false
        });
        this.scene = this.viewer.scene;
        this.camera = this.viewer.camera;

        var lonLatBound = this.getLonLatBound();
        DataProcess.process(filePath, particleSystemOptions, lonLatBound).then(
            (data) => {
                this.particleSystem = new ParticleSystem(this.scene.context, data);

                // the order of primitives.add should respect the dependency of primitives
                this.scene.primitives.add(this.particleSystem.computePrimitive);
                this.scene.primitives.add(this.particleSystem.particlePointsPrimitive);
                this.scene.primitives.add(this.particleSystem.particleTrailsPrimitive);
                this.scene.primitives.add(this.particleSystem.screenPrimitive);

                this.setupEventListener();
            });
    }

    getLonLatBound() {
        var viewRectangle = this.camera.computeViewRectangle(this.scene.globe.ellipsoid);
        var lonLatBound = Util.rectangleToLonLatBound(viewRectangle);
        return lonLatBound;
    }

    setupEventListener() {
        const that = this;

        this.camera.moveStart.addEventListener(function () {
            that.scene.primitives.show = false;
            that.particleSystem.clearFramebuffer();
        });

        this.camera.moveEnd.addEventListener(function () {
            var lonLatBound = that.getLonLatBound();
            that.particleSystem.refreshParticle(lonLatBound);
            that.scene.primitives.show = true;
        });

        var resized = false;
        window.addEventListener("resize", function () {
            resized = true;
            that.scene.primitives.show = false;
        });

        this.scene.preRender.addEventListener(function () {
            if (resized) {
                that.particleSystem.context = that.scene.context;
                that.particleSystem.canvasResize();
                resized = false;
                that.scene.primitives.show = true;
            }
        });
    }

    startRender() {
        const that = this;
        var animate = function () {
            that.scene.render();
            requestAnimationFrame(animate);
        }

        Util.debug(animate);
    }
}
