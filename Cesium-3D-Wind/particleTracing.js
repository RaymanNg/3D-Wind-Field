var ParticleTracing = (function () {
    let canvas;
    let camera, renderer;

    let computeScene, pointsScene, trailsScene;
    let scene, screen;

    let maxParticles = 65536, fadeOpacity = 0.999;
    let particleSystem, particlePoints, particleTrails;
    let currentParticlePosition, nextParticlePosition;

    let pointsTetxure, previousTrails, currentTrails;

    let spector;

    var init = async function () {
        canvas = document.getElementById('canvas');

        computeScene = new THREE.Scene();
        pointsScene = new THREE.Scene();
        trailsScene = new THREE.Scene();
        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = 9999.0;

        renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);

        let particleTextureSize = Math.round(Math.sqrt(maxParticles));
        let textureOptions = {
            format: THREE.RGBAFormat,
            type: THREE.FloatType
        };
        currentParticlePosition = new THREE.WebGLRenderTarget(particleTextureSize, particleTextureSize, textureOptions);
        nextParticlePosition = new THREE.WebGLRenderTarget(particleTextureSize, particleTextureSize, textureOptions);
        pointsTetxure = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
        previousTrails = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
        currentTrails = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);

        await Util.loadNetCDF('data/uv_0.nc').then(function () {
            Util.setupTextures(particleTextureSize);

            particleSystem = Util.initParticleSystem(particleTextureSize);
            computeScene.add(particleSystem);

            particlePoints = Util.initParticlePoints(particleTextureSize, currentParticlePosition);
            pointsScene.add(particlePoints);

            particleTrails = Util.initParticleTrails(pointsTetxure, previousTrails, fadeOpacity);
            trailsScene.add(particleTrails);

            screen = Util.initScreen(previousTrails);
            scene.add(screen);
        });
    }

    var swapTrails = function () {
        let temp = previousTrails;
        previousTrails = currentTrails;
        currentTrails = temp;

        particleTrails.material.uniforms.previousTrails.value = previousTrails.texture;
        particleTrails.material.uniforms.previousTrails.needsUpdate = true;
        particleTrails.material.needsUpdate = true;
    }

    var swapParticlePosition = function () {
        let temp = currentParticlePosition;
        currentParticlePosition = nextParticlePosition;
        nextParticlePosition = temp;

        particleSystem.material.uniforms.particles.value = currentParticlePosition.texture;
        particleSystem.material.uniforms.particles.needsUpdate = true;
        particleSystem.material.needsUpdate = true;

        particlePoints.material.uniforms.particles.value = currentParticlePosition.texture;
        particlePoints.material.uniforms.particles.needsUpdate = true;
        particlePoints.material.needsUpdate = true;
    }

    var render = function () {
        renderer.render(pointsScene, camera, pointsTetxure);
        renderer.render(trailsScene, camera, currentTrails);
        renderer.render(scene, camera);
        renderer.render(computeScene, camera, nextParticlePosition);

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
        animate: animate,
        debug: debug
    }
})();

// ParticleTracing.init().then(() => {
//     ParticleTracing.animate();
//     ParticleTracing.debug();
// });
