var Wind3D = (function () {
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmYWEyMmExOS1lYjA2LTQ1YjItOTMwMS03ZWYwMzg1MWY3NWYiLCJpZCI6NDY4OCwic2NvcGVzIjpbImFzciIsImdjIl0sImlhdCI6MTU0MTQyMDMzMX0.e5QtAVvpj2oWYIiXyN5oEsFvxF6buKxhj-oOx0L1g7M';

    const filePath = 'data/uv_0.nc';
    const particlesTextureSize = 256;
    const fadeOpacity = 0.996;

    /** @type {Cesium.Viewer} */
    var viewer;

    var init = function () {
        viewer = new Cesium.Viewer('cesiumContainer', {
            shouldAnimate: true
        });

        DataProcess.process(filePath, particlesTextureSize, fadeOpacity).then(function (data) {
            viewer.scene.primitives.add(ParticleSystem.init(viewer.scene.context, data));
        });
    }

    return {
        init: init
    }

})();

Wind3D.init();
