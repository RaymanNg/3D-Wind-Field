var ParticleSystem = (function () {
    var fullscreenQuad = new Cesium.GeometryInstance(
        new Cesium.Geometry({
            attributes: {
                corner: new Cesium.GeometryAttribute({
                    componentDatatype: Cesium.ComponentDatatype.FLOAT,
                    componentsPerAttribute: 2,
                    values: new Float32Array(
                        [
                            0, 0, 1, 0, 0, 1,
                            0, 1, 1, 0, 1, 1
                        ])
                })
            },
            primitiveType: Cesium.PrimitiveType.POINTS
        })
    );

    var compute = new Cesium.Appearance({
        material: Cesium.Material.fromType('Test'),
        vertexShaderSource: Util.getShaderCode('glsl/fullscreen.vert'),
        fragmentShaderSource: Util.getShaderCode('glsl/update.frag'),
    });

    var windField = new Cesium.Material({
        fabric: {
            type: 'WindField',
            uniforms: {

            }
        }
    });

    var particlePrimitive = new Cesium.Primitive({
        material: windField,
        geometryInstances: [fullscreenQuad],
        appearance: compute
    });

})();