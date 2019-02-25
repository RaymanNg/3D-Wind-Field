class CustomPrimitive {
    constructor(options) {
        var geometry = options.geometry;
        var attributeLocations = options.attributeLocations;
        var primitiveType = options.primitiveType;
        var uniformMap = options.uniformMap;
        var vertexShaderFilePath = options.vertexShaderFilePath;
        var fragmentShaderFilePath = options.fragmentShaderFilePath;
        var viewport = options.viewport;
        var framebuffer = options.framebuffer;

        function createVertexArray(context) {
            var vertexArray = Cesium.VertexArray.fromGeometry({
                context: context,
                geometry: geometry,
                attributeLocations: attributeLocations,
                bufferUsage: Cesium.BufferUsage.STATIC_DRAW,
            });

            return vertexArray;
        };

        function createCommand(context) {
            var vertexShaderSource = new Cesium.ShaderSource({
                sources: [Util.getShaderCode(vertexShaderFilePath)]
            });

            var fragmentShaderSource = new Cesium.ShaderSource({
                sources: [Util.getShaderCode(fragmentShaderFilePath)]
            });

            var shaderProgram = Cesium.ShaderProgram.fromCache({
                context: context,
                attributeLocations: attributeLocations,
                vertexShaderSource: vertexShaderSource,
                fragmentShaderSource: fragmentShaderSource
            });

            var translucent = true;
            var closed = false;
            var existing = undefined;

            var rawRenderState = Cesium.Appearance.getDefaultRenderState(translucent, closed, existing);
            rawRenderState.viewport = viewport;
            var renderState = Cesium.RenderState.fromCache(rawRenderState);

            return new Cesium.DrawCommand({
                owner: this,
                vertexArray: createVertexArray(context),
                primitiveType: primitiveType,
                uniformMap: uniformMap,
                modelMatrix: Cesium.Matrix4.IDENTITY,
                shaderProgram: shaderProgram,
                framebuffer: framebuffer,
                pass: Cesium.Pass.OPAQUE,
                renderState: renderState
            });
        }

        this.show = true;
        this._command = undefined;
        this._createCommand = createCommand;
    }

    update(frameState) {
        if (!this.show) {
            return;
        }

        if (!Cesium.defined(this._command)) {
            this._command = this._createCommand(frameState.context);
        }

        if (Cesium.defined(this._command)) {
            frameState.commandList.push(this._command);
        }
    }

    isDestroyed() {
        return false;
    }

    destroy() {
        if (Cesium.defined(this._command)) {
            this._command.shaderProgram = this._command.shaderProgram && this._command.shaderProgram.destroy();
        }
        return Cesium.destroyObject(this);
    };
}
