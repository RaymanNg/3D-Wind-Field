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

                var variables = arrayToMap(NetCDF.variables);
                var lonAttributes = arrayToMap(variables['lon'].attributes);
                var latAttributes = arrayToMap(variables['lat'].attributes);
                var levAttributes = arrayToMap(variables['lev'].attributes);
                var uAttributes = arrayToMap(variables['U'].attributes);
                var vAttributes = arrayToMap(variables['V'].attributes);

                data.lon = {};
                data.lon.array = new Float32Array(NetCDF.getDataVariable('lon').flat());
                data.lon.min = lonAttributes['min'].value;
                data.lon.max = lonAttributes['max'].value;

                data.lat = {};
                data.lat.array = new Float32Array(NetCDF.getDataVariable('lat').flat());
                data.lat.min = latAttributes['min'].value;
                data.lat.max = latAttributes['max'].value;

                data.lev = {};
                data.lev.array = new Float32Array(NetCDF.getDataVariable('lev').flat());
                data.lev.min = levAttributes['min'].value;
                data.lev.max = levAttributes['max'].value;

                data.U = {};
                data.U.array = new Float32Array(NetCDF.getDataVariable('U').flat());
                data.U.min = uAttributes['min'].value;
                data.U.max = uAttributes['max'].value;

                data.V = {};
                data.V.array = new Float32Array(NetCDF.getDataVariable('V').flat());
                data.V.min = vAttributes['min'].value;
                data.V.max = vAttributes['max'].value;

                resolve(data);
            };

            request.send();
        });
    }

    var loadColorRamp = function (filePath) {
        var string = Util.getText(filePath);
        var json = JSON.parse(string);

        var colorNum = json['ncolors'];
        var colorArray = json['colorRamp'];

        var colorRampArray = new Uint8Array(3 * colorNum);
        for (var i = 0; i < colorNum; i++) {
            colorRampArray[3 * i] = colorArray[3 * i];
            colorRampArray[3 * i + 1] = colorArray[3 * i + 1];
            colorRampArray[3 * i + 2] = colorArray[3 * i + 2];
        }

        return {
            num: colorNum,
            array: colorRampArray
        }
    }

    var randomizeParticle = function (maxParticles, lonLatRange) {
        var array = new Float32Array(4 * maxParticles);

        for (var i = 0; i < maxParticles; i++) {
            array[4 * i] = Cesium.Math.randomBetween(lonLatRange.lon.min, lonLatRange.lon.max);
            array[4 * i + 1] = Cesium.Math.randomBetween(lonLatRange.lat.min, lonLatRange.lat.max);
            array[4 * i + 2] = Cesium.Math.randomBetween(data.lev.min, data.lev.max);
            array[4 * i + 3] = Cesium.Math.randomBetween(-20.0, 20.0);
        }

        return array;
    }

    var setupParticle = function (particleSystemOptions, lonLatRange) {
        const particlesTextureSize = particleSystemOptions.particlesTextureSize;
        const fadeOpacity = particleSystemOptions.fadeOpacity;
        const dropRate = particleSystemOptions.dropRate;

        const maxParticles = particlesTextureSize * particlesTextureSize;

        data.particles = {};
        data.particles.array = randomizeParticle(maxParticles, lonLatRange);

        data.particles.textureSize = particlesTextureSize;
        data.particles.fadeOpacity = fadeOpacity;
        data.particles.dropRate = dropRate;
    }

    var process = async function (filePath, particleSystemOptions, lonLatRange) {
        await loadNetCDF(filePath).then(function () {
            setupParticle(particleSystemOptions, lonLatRange);
        });

        return data;
    }

    return {
        process: process,
        loadColorRamp: loadColorRamp,
        randomizeParticle: randomizeParticle
    };

})();