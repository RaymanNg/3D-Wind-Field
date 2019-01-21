Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmYWEyMmExOS1lYjA2LTQ1YjItOTMwMS03ZWYwMzg1MWY3NWYiLCJpZCI6NDY4OCwic2NvcGVzIjpbImFzciIsImdjIl0sImlhdCI6MTU0MTQyMDMzMX0.e5QtAVvpj2oWYIiXyN5oEsFvxF6buKxhj-oOx0L1g7M';

let viewer = new Cesium.Viewer('cesiumContainer', {
    shouldAnimate: true
});

let fragmentShaderSource = Util.getShaderCode('glsl/postprocessing.frag');
viewer.scene.postProcessStages.add(new Cesium.PostProcessStage({
    fragmentShader: fragmentShaderSource
}));
