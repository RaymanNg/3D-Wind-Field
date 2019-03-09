var Wind3D = (function () {
    const filePath = 'data/uv_0.nc';
    const particleSystemOptions = {
        particlesTextureSize: 256,
        fadeOpacity: 0.996,
        dropRate: 0.03,
    }

    /** @type {Cesium.Viewer} */var viewer;
    /** @type {Cesium.Scene} */var scene;
    var particleSystem;

    /** @type {Cesium.Rectangle} */var viewRectangle;
    var minMax;

    var init = function () {
        viewer = new Cesium.Viewer('cesiumContainer', {
            scene3DOnly: true,
            imageryProvider: Cesium.createTileMapServiceImageryProvider({
                url: Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
            }),
            baseLayerPicker: false,
            geocoder: false
        });
        scene = viewer.scene;

        viewRectangle = viewer.camera.computeViewRectangle(scene.globe.ellipsoid);
        minMax = Util.rectangleToMinMax(viewRectangle);

        // setup camera event listener
        viewer.camera.moveEnd.addEventListener(function () {
            viewRectangle = viewer.camera.computeViewRectangle(scene.globe.ellipsoid);
            minMax = Util.rectangleToMinMax(viewRectangle);
            particleSystem.refreshParticle(minMax);
        });

        DataProcess.process(filePath, particleSystemOptions, minMax).then(function (data) {
            particleSystem = ParticleSystem.init(scene.context, data);

            // the order of primitives.add should respect the dependency of primitives
            scene.primitives.add(particleSystem.computePrimitive);
            scene.primitives.add(particleSystem.particlePointsPrimitive);
            scene.primitives.add(particleSystem.particleTrailsPrimitive);
            scene.primitives.add(particleSystem.screenPrimitive);

            var animate = function () {
                scene.render();
                requestAnimationFrame(animate);
            }

            Util.debug(animate);
        });
    }

    return {
        init: init
    }

})();

// Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmYWEyMmExOS1lYjA2LTQ1YjItOTMwMS03ZWYwMzg1MWY3NWYiLCJpZCI6NDY4OCwic2NvcGVzIjpbImFzciIsImdjIl0sImlhdCI6MTU0MTQyMDMzMX0.e5QtAVvpj2oWYIiXyN5oEsFvxF6buKxhj-oOx0L1g7M';
Wind3D.init();
