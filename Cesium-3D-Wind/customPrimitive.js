class CustomPrimitive {
    constructor(options) {
        var geometry = options.geometry;
        var attributeLocations = options.attributeLocations;
        var primitiveType = options.primitiveType;
        var uniformMap = options.uniformMap;
        var vertexShaderSource = options.vertexShaderSource;
        var fragmentShaderSource = options.fragmentShaderSource;
        var rawRenderState = options.rawRenderState;
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

        function createDrawCommand(context) {
            var shaderProgram = Cesium.ShaderProgram.fromCache({
                context: context,
                attributeLocations: attributeLocations,
                vertexShaderSource: vertexShaderSource,
                fragmentShaderSource: fragmentShaderSource
            });

            var renderState = Cesium.RenderState.fromCache(rawRenderState);

            return new Cesium.DrawCommand({
                owner: this,
                vertexArray: createVertexArray(context),
                primitiveType: primitiveType,
                uniformMap: uniformMap,
                modelMatrix: Cesium.Matrix4.IDENTITY,
                shaderProgram: shaderProgram,
                framebuffer: framebuffer,
                renderState: renderState,
                pass: Cesium.Pass.OPAQUE
            });
        }

        this.show = true;
        this._drawCommand = undefined;
        this._createDrawCommand = createDrawCommand;
    }

    preExecute() {
        // this function will be executed before the drawCommand
    }

    update(frameState) {
        if (!this.show) {
            return;
        }

        if (!Cesium.defined(this._drawCommand)) {
            this._drawCommand = this._createDrawCommand(frameState.context);
        }

        if (Cesium.defined(this._drawCommand)) {
            this.preExecute();
            frameState.commandList.push(this._drawCommand);
        }
    }

    isDestroyed() {
        return false;
    }

    destroy() {
        if (Cesium.defined(this._drawCommand)) {
            this._drawCommand.shaderProgram = this._drawCommand.shaderProgram && this._drawCommand.shaderProgram.destroy();
        }
        return Cesium.destroyObject(this);
    };
}
