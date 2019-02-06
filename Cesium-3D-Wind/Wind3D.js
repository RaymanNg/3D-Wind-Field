var Wind3D = (function () {
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmYWEyMmExOS1lYjA2LTQ1YjItOTMwMS03ZWYwMzg1MWY3NWYiLCJpZCI6NDY4OCwic2NvcGVzIjpbImFzciIsImdjIl0sImlhdCI6MTU0MTQyMDMzMX0.e5QtAVvpj2oWYIiXyN5oEsFvxF6buKxhj-oOx0L1g7M';

    /** @type {Cesium.Viewer} */
    var viewer;

    /** @type {Cesium.PostProcessStage} */
    var stage;

    var init = function () {
        viewer = new Cesium.Viewer('cesiumContainer', {
            shouldAnimate: true
        });
        var fragmentShaderSource = Util.getShaderCode('glsl/postprocessing.frag');
        stage = new Cesium.PostProcessStage({
            fragmentShader: fragmentShaderSource,
            uniforms: {
                particleTrails: document.getElementById('particleTrails')
            }
        });
        viewer.scene.postProcessStages.add(stage);
    }

    var updateCamera = function () {

    }

    var updateTexture = function () {
        stage._texturesToCreate.push({
            name: 'particleTrails',
            source: document.getElementById('particleTrails')
        });
    }

    var update = function () {
        updateCamera();
        ParticleTracing.render();
        updateTexture();
    }

    return {
        init: init,
        update: update
    }

})();

ParticleTracing.init().then(() => {
    Wind3D.init();
    ParticleTracing.debug();
    setInterval(Wind3D.updateCamera, 100);
    ParticleTracing.animate();
});
