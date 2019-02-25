Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmYWEyMmExOS1lYjA2LTQ1YjItOTMwMS03ZWYwMzg1MWY3NWYiLCJpZCI6NDY4OCwic2NvcGVzIjpbImFzciIsImdjIl0sImlhdCI6MTU0MTQyMDMzMX0.e5QtAVvpj2oWYIiXyN5oEsFvxF6buKxhj-oOx0L1g7M';

var Wind3D = (function () {
    const filePath = 'data/uv_0.nc';
    const particlesTextureSize = 256;
    const fadeOpacity = 0.996;

    /** @type {Cesium.Viewer} */
    var viewer;

    var init = function () {
        viewer = new Cesium.Viewer('cesiumContainer', {
            shouldAnimate: true,
            imageryProvider: Cesium.createTileMapServiceImageryProvider({
                url: Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
            }),
            baseLayerPicker: false,
            geocoder: false
        });

        DataProcess.process(filePath, particlesTextureSize, fadeOpacity).then(function (data) {
            var primitives = ParticleSystem.init(viewer.scene.context, data)

            // the order of primitives.add should respect the dependency of primitives
            viewer.scene.primitives.add(primitives.computePrimitive);
            viewer.scene.primitives.add(primitives.particlePointsPrimitive);

            Util.debug(viewer.scene);
        });
    }

    return {
        init: init
    }

})();

Wind3D.init();
