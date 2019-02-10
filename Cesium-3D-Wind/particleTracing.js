var ParticleTracing = (function () {
    /** @type {HTMLElement} */var particleTrailsCanvas;

    /** @type {THREE.WebGLRenderer} */var particleRenderer;

    /** @type {THREE.Scene} */var computeScene;
    /** @type {THREE.Scene} */var pointsScene;
    /** @type {THREE.Scene} */var trailsScene;
    /** @type {THREE.Scene} */var scene;

    /** @type {THREE.OrthographicCamera} */var orthographicCamera;

    const maxParticles = 65536;
    const fadeOpacity = 0.5;

    /** @type {THREE.WebGLRenderTarget} */var currentParticlePosition;
    /** @type {THREE.WebGLRenderTarget} */var nextParticlePosition;
    /** @type {THREE.WebGLRenderTarget} */var pointsTetxure;
    /** @type {THREE.WebGLRenderTarget} */var previousTrails;
    /** @type {THREE.WebGLRenderTarget} */var currentTrails;

    /** @type {THREE.Mesh} */var particleSystem;
    /** @type {THREE.Mesh} */var particlePoints;
    /** @type {THREE.Mesh} */var particleTrails;
    /** @type {THREE.Mesh} */var trailsScreen;

    var spector;

    var init = async function () {
        await Util.loadNetCDF('data/uv_0.nc').then(function () {
            particleTrailsCanvas = document.getElementById('particleTrails');

            particleRenderer = new THREE.WebGLRenderer({ canvas: particleTrailsCanvas, alpha: true });
            particleRenderer.setPixelRatio(window.devicePixelRatio);
            particleRenderer.setSize(window.innerWidth, window.innerHeight);

            computeScene = new THREE.Scene();
            pointsScene = new THREE.Scene();
            trailsScene = new THREE.Scene();
            scene = new THREE.Scene();

            orthographicCamera = new THREE.OrthographicCamera(
                Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY,
                Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY,
                1, Number.POSITIVE_INFINITY);

            const particleTextureSize = Math.round(Math.sqrt(maxParticles));
            const textureOptions = {
                format: THREE.RGBAFormat,
                type: THREE.FloatType
            };

            currentParticlePosition = new THREE.WebGLRenderTarget(particleTextureSize, particleTextureSize, textureOptions);
            nextParticlePosition = new THREE.WebGLRenderTarget(particleTextureSize, particleTextureSize, textureOptions);
            pointsTetxure = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
            previousTrails = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
            currentTrails = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);

            Util.setupTextures(particleTextureSize);

            particleSystem = Util.initParticleSystem(particleTextureSize);
            computeScene.add(particleSystem);

            particlePoints = Util.initParticlePoints(particleTextureSize, currentParticlePosition);
            pointsScene.add(particlePoints);

            particleTrails = Util.initParticleTrails(pointsTetxure, previousTrails, fadeOpacity);
            trailsScene.add(particleTrails);

            trailsScreen = Util.initScreen(previousTrails.texture);
            scene.add(trailsScreen);
        });
    }

    var swapTrails = function () {
        var temp = previousTrails;
        previousTrails = currentTrails;
        currentTrails = temp;

        particleTrails.material.uniforms.previousTrails.value = previousTrails.texture;
        particleTrails.material.needsUpdate = true;
    }

    var swapParticlePosition = function () {
        var temp = currentParticlePosition;
        currentParticlePosition = nextParticlePosition;
        nextParticlePosition = temp;

        particleSystem.material.uniforms.particles.value = currentParticlePosition.texture;
        particleSystem.material.needsUpdate = true;

        particlePoints.material.uniforms.particles.value = currentParticlePosition.texture;
        particlePoints.material.needsUpdate = true;
    }

    var setCamera = function (projectionArray, viewArray) {
        var projectionMatrix = new THREE.Matrix4();
        projectionMatrix.fromArray(projectionArray);

        var viewMatrix = new THREE.Matrix4();
        viewMatrix.fromArray(viewArray);

        particlePoints.material.uniforms.cesiumProjection.value = projectionMatrix;
        particlePoints.material.uniforms.cesiumView.value = viewMatrix;
        particlePoints.material.needsUpdate = true;
    }

    var render = function () {
        particleRenderer.render(pointsScene, orthographicCamera, pointsTetxure);
        particleRenderer.render(trailsScene, orthographicCamera, currentTrails);
        particleRenderer.render(scene, orthographicCamera);
        particleRenderer.render(computeScene, orthographicCamera, nextParticlePosition);

        swapTrails();
        swapParticlePosition();
    }

    var animate = function () {
        requestAnimationFrame(animate);
        render();
    }

    var debug = function () {
        spector = new SPECTOR.Spector();
        spector.displayUI();
        spector.spyCanvases();
    }

    return {
        init: init,
        setCamera: setCamera,
        render: render,
        animate: animate,
        debug: debug
    }
})();
