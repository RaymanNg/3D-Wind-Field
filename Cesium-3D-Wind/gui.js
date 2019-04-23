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

const layerSources = [
    "NaturalEarthII",
    "WMS",
    "WorldTerrain"
]

const WMSlayers = [
    { name: "Precipitable_water_entire_atmosphere_single_layer", ColorScaleRange: '0.1,66.8' },
    { name: "Pressure_surface", ColorScaleRange: '51640,103500' },
    { name: "Temperature_surface", ColorScaleRange: '204.1,317.5' },
    { name: "Wind_speed_gust_surface", ColorScaleRange: '0.1095,35.31' },
];

// the date of the wind field data is 20180916_0000
const defaultDisplayOptions = {
    "layerSource": layerSources[0],
    "WMSURL": "https://www.ncei.noaa.gov/thredds/wms/gfs-004-files/201809/20180916/gfs_4_20180916_0000_000.grb2",
    "WMSlayer": WMSlayers[0]
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

        this.layerSource = defaultDisplayOptions.layerSource;
        this.WMSURL = defaultDisplayOptions.WMSURL;
        this.WMSlayerSelect = WMSlayers[0].name;
        this.WMSlayer = defaultDisplayOptions.WMSlayer;

        var layerNames = [];
        WMSlayers.forEach(function (layer) {
            layerNames.push(layer.name);
        });

        this.changed = false;

        const that = this;
        var onParticleSystemOptionsChange = function () {
            var event = new CustomEvent('particleSystemOptionsChanged', { detail: that.getParticleSystemOptions() });
            window.dispatchEvent(event);
        }

        var onDisplayOptionsChange = function () {
            that.WMSlayer = WMSlayers.find(function (layer) {
                return layer.name == that.WMSlayerSelect;
            });
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

            gui.add(that, 'layerSource', layerSources).onFinishChange(onDisplayOptionsChange);
            gui.add(that, 'WMSlayerSelect', layerNames).onFinishChange(onDisplayOptionsChange);

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
            layerSource: this.layerSource,
            WMSURL: this.WMSURL,
            WMSlayer: this.WMSlayer
        }
    }
}
