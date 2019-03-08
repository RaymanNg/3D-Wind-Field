var DataProcess = (function () {
    var data;

    var loadNetCDF = function (filePath) {
        return new Promise(function (resolve) {
            var request = new XMLHttpRequest();
            request.open('GET', filePath);
            request.responseType = 'arraybuffer';

            request.onload = function () {
                var arrayToMap = function (array) {
                    return array.reduce(function (map, object) {
                        map[object.name] = object;
                        return map;
                    }, {});
                }

                var NetCDF = new netcdfjs(request.response);
                data = {};

                var dimensions = arrayToMap(NetCDF.dimensions);
                data.dimensions = {};
                data.dimensions.lon = dimensions['lon'].size;
                data.dimensions.lat = dimensions['lat'].size;
                data.dimensions.lev = dimensions['lev'].size;

                data.lon = {};
                data.lon.array = new Float32Array(NetCDF.getDataVariable('lon').flat());
                data.lon.min = data.lon.array[0];
                data.lon.max = data.lon.array[data.lon.array.length - 1];

                data.lat = {};
                data.lat.array = new Float32Array(NetCDF.getDataVariable('lat').flat());
                data.lat.min = data.lat.array[0];
                data.lat.max = data.lat.array[data.lat.array.length - 1];

                data.lev = {};
                data.lev.array = new Float32Array(NetCDF.getDataVariable('lev').flat());
                data.lev.min = data.lev.array[0];
                data.lev.max = data.lev.array[data.lev.array.length - 1];

                data.U = {};
                data.U.array = new Float32Array(NetCDF.getDataVariable('U').flat());

                data.V = {};
                data.V.array = new Float32Array(NetCDF.getDataVariable('V').flat());

                resolve(data);
            };

            request.send();
        });
    }

    var randomizeParticle = function (maxParticles, min, max) {
        var array = new Float32Array(3 * maxParticles);

        for (var i = 0; i < maxParticles; i++) {
            array[3 * i] = Math.random() * (max.lon - min.lon) + min.lon;
            array[3 * i + 1] = Math.random() * (max.lat - min.lat) + min.lat;
            array[3 * i + 2] = Math.random() * (data.lev.max - data.lev.min) + data.lev.min;
        }

        return array;
    }

    var setupParticle = function (particleSystemOptions, minMax) {
        const particlesTextureSize = particleSystemOptions.particlesTextureSize;
        const fadeOpacity = particleSystemOptions.fadeOpacity;
        const dropRate = particleSystemOptions.dropRate;

        const maxParticles = particlesTextureSize * particlesTextureSize;
        var min = minMax.min;
        var max = minMax.max;

        data.particles = {};
        data.particles.array = randomizeParticle(maxParticles, min, max);

        data.particles.textureSize = particlesTextureSize;
        data.particles.fadeOpacity = fadeOpacity;
        data.particles.dropRate = dropRate;
    }

    var process = async function (filePath, particleSystemOptions, minMax) {
        await loadNetCDF(filePath).then(function () {
            setupParticle(particleSystemOptions, minMax);
        });

        return data;
    }

    return {
        process: process,
        randomizeParticle: randomizeParticle
    };

})();