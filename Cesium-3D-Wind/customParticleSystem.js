var ParticleSystem = (function () {
    var data;
    var context;

    /** @type {Cesium.Geometry} */var fullscreenQuad;
    /** @type {Cesium.Primitive} */var computePrimitive;
    /** @type {Cesium.Geometry} */var particlePoints;
    /** @type {Cesium.Primitive} */var particlePointsPrimitive;

    var createTexture = function (typedArray, options) {
        var source = {};
        source.arrayBufferView = typedArray; // source is required by Cesium.Texture 
        options.source = source;

        var texture = new Cesium.Texture(options);
        texture.type = 'sampler2D'; // workaround for uniform type check
        return texture;
    }

    var initcomputePrimitive = function (cesiumContext, windData) {
        context = cesiumContext;
        data = windData;

        fullscreenQuad = new Cesium.Geometry({
            attributes: new Cesium.GeometryAttributes({
                position: new Cesium.GeometryAttribute({
                    componentDatatype: Cesium.ComponentDatatype.FLOAT,
                    componentsPerAttribute: 3,
                    //  v3----v2
                    //  |     |
                    //  |     |
                    //  v0----v1
                    values: new Float32Array([
                        -1, -1, 0, // v0
                        1, -1, 0, // v1
                        1, 1, 0, // v2
                        -1, 1, 0, // v3
                    ])
                }),
                st: new Cesium.GeometryAttribute({
                    componentDatatype: Cesium.ComponentDatatype.FLOAT,
                    componentsPerAttribute: 2,
                    values: new Float32Array([
                        0, 0,
                        1, 0,
                        1, 1,
                        0, 1,
                    ])
                })
            }),
            primitiveType: Cesium.PrimitiveType.TRIANGLES,
            indices: new Uint32Array([3, 2, 0, 0, 2, 1])
        });

        var attributeLocations = {
            position: 0,
            st: 1
        };

        const uvTextureOptions = {
            context: context,
            width: data.dimensions.lon,
            height: data.dimensions.lat * data.dimensions.lev,
            pixelFormat: Cesium.PixelFormat.RGB,
            PixelDatatype: Cesium.PixelDatatype.FLOAT
        };

        var U = createTexture(data.U.array, uvTextureOptions);
        var V = createTexture(data.V.array, uvTextureOptions);

        const particlesTextureOptions = {
            context: context,
            width: data.particles.textureSize,
            height: data.particles.textureSize,
            pixelFormat: Cesium.PixelFormat.RGB,
            PixelDatatype: Cesium.PixelDatatype.FLOAT
        };

        var particles = createTexture(data.particles.array, particlesTextureOptions);

        var windFieldDimensions = new Cesium.Cartesian3(data.dimensions.lon, data.dimensions.lat, data.dimensions.lev);

        var windFieldSteps = new Cesium.Cartesian3();
        windFieldSteps.x = (data.lon.max - data.lon.min) / data.lon.array.length;
        windFieldSteps.y = (data.lat.max - data.lat.min) / data.lat.array.length;
        windFieldSteps.z = (data.lev.max - data.lev.min) / data.lev.array.length;

        var uniformMap = {
            U: function () {
                return U;
            },
            V: function () {
                return V;
            },
            windFieldDimensions: function () {
                return windFieldDimensions;
            },
            windFieldSteps: function () {
                return windFieldSteps;
            },
            particles: function () {
                return particles;
            }
        }

        computePrimitive = new CustomPrimitive({
            geometry: fullscreenQuad,
            attributeLocations: attributeLocations,
            uniformMap: uniformMap,
            vertexShaderFilePath: 'glsl/fullscreen.vert',
            fragmentShaderFilePath: 'glsl/update.frag'
        });
    }

    var initParticlePointPrimitive = function (cesiumContext, windData) {
        var particleTextureSize = windData.particles.textureSize;
        var particleIndex = [];

        for (var s = 0; s < particleTextureSize; s++) {
            for (var t = 0; t < particleTextureSize; t++) {
                particleIndex.push(s / particleTextureSize);
                particleIndex.push(t / particleTextureSize);
                particleIndex.push(0.0);
            }
        }
        particleIndex = new Float32Array(particleIndex);

        particlePoints = new Cesium.Geometry({
            attributes: new Cesium.GeometryAttributes({
                position: new Cesium.GeometryAttribute({
                    componentDatatype: Cesium.ComponentDatatype.FLOAT,
                    componentsPerAttribute: 3,
                    values: particleIndex
                })
            }),
            primitiveType: Cesium.PrimitiveType.POINTS
        });

    }

    var init = function (cesiumContext, windData) {
        initcomputePrimitive(cesiumContext, windData);
    }

    return {
        init: init
    }

})();
