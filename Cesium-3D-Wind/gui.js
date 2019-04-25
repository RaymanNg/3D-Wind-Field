var demo = Cesium.defaultValue(demo, false);

const defaultFileOptions = {
    dataDirectory: demo ? 'https://raw.githubusercontent.com/RaymanNg/3D-Wind-Field/master/data/' : '../data/',
    glslDirectory: demo ? '../Cesium-3D-Wind/glsl/' : 'glsl/'
}

const defaultParticleSystemOptions = {
    maxParticles: 128 * 128,
    particleHeight: 100.0,
    fadeOpacity: 0.996,
    dropRate: 0.003,
    dropRateBump: 0.01,
    speedFactor: 4.0,
    lineWidth: 4.0
}

const globeLayers = [
    { name: "NaturalEarthII", type: "NaturalEarthII" },
    { name: "WMS:Rainfall", type: "WMS", layer: "Precipitable_water_entire_atmosphere_single_layer", ColorScaleRange: '0.1,66.8' },
    { name: "WMS:Air Pressure", type: "WMS", layer: "Pressure_surface", ColorScaleRange: '51640,103500' },
    { name: "WMS:Temperature", type: "WMS", layer: "Temperature_surface", ColorScaleRange: '204.1,317.5' },
    { name: "WMS:Wind Speed", type: "WMS", layer: "Wind_speed_gust_surface", ColorScaleRange: '0.1095,35.31' },
    { name: "WorldTerrain", type: "WorldTerrain" }
]

// the date of the wind field data is 20180916_0000
const defaultDisplayOptions = {
    "globeLayer": globeLayers[0],
    "WMS_URL": "https://www.ncei.noaa.gov/thredds/wms/gfs-004-files/201809/20180916/gfs_4_20180916_0000_000.grb2",
}

class Panel {
    constructor() {
        this.dataDirectory = defaultFileOptions.dataDirectory;
        this.glslDirectory = defaultFileOptions.glslDirectory;

        this.maxParticles = defaultParticleSystemOptions.maxParticles;
        this.particleHeight = defaultParticleSystemOptions.particleHeight;
        this.fadeOpacity = defaultParticleSystemOptions.fadeOpacity;
        this.dropRate = defaultParticleSystemOptions.dropRate;
        this.dropRateBump = defaultParticleSystemOptions.dropRateBump;
        this.speedFactor = defaultParticleSystemOptions.speedFactor;
        this.lineWidth = defaultParticleSystemOptions.lineWidth;

        this.globeLayer = defaultDisplayOptions.globeLayer;
        this.WMS_URL = defaultDisplayOptions.WMS_URL;

        var layerNames = [];
        globeLayers.forEach(function (layer) {
            layerNames.push(layer.name);
        });
        this.layerToShow = layerNames[0];

        this.changed = false;

        const that = this;
        var onParticleSystemOptionsChange = function () {
            var event = new CustomEvent('particleSystemOptionsChanged', { detail: that.getParticleSystemOptions() });
            window.dispatchEvent(event);
        }

        var onDisplayOptionsChange = function () {
            for (var i = 0; i < globeLayers.length; i++) {
                if (that.layerToShow == globeLayers[i].name) {
                    that.globeLayer = globeLayers[i];
                    break;
                }
            }
            var event = new CustomEvent('displayOptionsChanged', { detail: that.getDisplayOptions() });
            window.dispatchEvent(event);
        }

        window.onload = function () {
            var gui = new dat.GUI({ autoPlace: false });
            gui.add(that, 'maxParticles', 1, 256 * 256, 1).onFinishChange(onParticleSystemOptionsChange);
            gui.add(that, 'particleHeight', 1, 10000, 1).onFinishChange(onParticleSystemOptionsChange);
            gui.add(that, 'fadeOpacity', 0.90, 0.999, 0.001).onFinishChange(onParticleSystemOptionsChange);
            gui.add(that, 'dropRate', 0.0, 0.1).onFinishChange(onParticleSystemOptionsChange);
            gui.add(that, 'dropRateBump', 0, 0.2).onFinishChange(onParticleSystemOptionsChange);
            gui.add(that, 'speedFactor', 0.5, 100).onFinishChange(onParticleSystemOptionsChange);
            gui.add(that, 'lineWidth', 0.01, 16.0).onFinishChange(onParticleSystemOptionsChange);

            gui.add(that, 'layerToShow', layerNames).onFinishChange(onDisplayOptionsChange);

            var panelContainer = document.getElementsByClassName('cesium-widget').item(0);
            gui.domElement.classList.add('myPanel');
            panelContainer.appendChild(gui.domElement);
        };
    }

    getFileOptions() {
        return {
            dataDirectory: this.dataDirectory,
            glslDirectory: this.glslDirectory
        }
    }

    getParticleSystemOptions() {
        return {
            maxParticles: this.maxParticles,
            particleHeight: this.particleHeight,
            fadeOpacity: this.fadeOpacity,
            dropRate: this.dropRate,
            dropRateBump: this.dropRateBump,
            speedFactor: this.speedFactor,
            lineWidth: this.lineWidth,
        }
    }

    getDisplayOptions() {
        return {
            globeLayer: this.globeLayer,
            WMS_URL: this.WMS_URL
        }
    }
}
