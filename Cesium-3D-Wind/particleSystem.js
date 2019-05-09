class ParticleSystem {
    constructor(context, data, userInput, viewerParameters) {
        this.context = context;
        this.data = data;
        this.userInput = userInput;
        this.viewerParameters = viewerParameters;

        this.particlesComputing = new ParticlesComputing(this.context, this.data, this.userInput, this.viewerParameters);
        this.particlesRendering = new ParticlesRendering(this.context, this.data, this.userInput, this.viewerParameters);
    }

    canvasResize(context) {
        this.particlesComputing.destroyParticlesTextures();
        Object.keys(this.particlesComputing.windTextures).forEach(function (key) {
            this.particlesComputing.windTextures[key].destroy();
        });

        this.particlesRendering.textures.colorTable.destroy();
        Object.keys(this.particlesRendering.framebuffers).forEach(function (key) {
            this.particlesRendering.framebuffers[key].destroy();
        });

        this.context = context;
        this.particlesComputing = new ParticlesComputing(this.context, this.data, this.userInput, this.viewerParameters);
        this.particlesRendering = new ParticlesRendering(this.context, this.data, this.userInput, this.viewerParameters);
    }

    clearFramebuffers() {
        var clearCommand = new Cesium.ClearCommand({
            color: new Cesium.Color(0.0, 0.0, 0.0, 0.0),
            depth: 1.0,
            framebuffer: undefined,
            pass: Cesium.Pass.OPAQUE
        });

        clearCommand.framebuffer = this.particlesRendering.framebuffers.segments;
        clearCommand.execute(this.context);
        clearCommand.framebuffer = this.particlesRendering.framebuffers.currentTrails;
        clearCommand.execute(this.context);
        clearCommand.framebuffer = this.particlesRendering.framebuffers.nextTrails;
        clearCommand.execute(this.context);
    }

    refreshParticle(maxParticlesChanged) {
        this.clearFramebuffers();
        if (maxParticlesChanged) {
            this.particlesComputing.destroyParticlesTextures();
            this.particlesComputing.createParticlesTextures(this.context, this.userInput);
        }
    }

    applyUserInput(userInput) {
        var maxParticlesChanged = false;
        if (this.userInput.maxParticles != userInput.maxParticles) {
            maxParticlesChanged = true;
        }

        Object.keys(userInput).forEach(function (key) {
            this.userInput[key] = userInput[key];
        });
        this.refreshParticle(maxParticlesChanged);
    }

    applyViewerParameters(viewerParameters) {
        Object.keys(viewerParameters).forEach(function (key) {
            this.viewerParameters[key] = viewerParameters[key];
        });
        this.refreshParticle(false);
    }
}