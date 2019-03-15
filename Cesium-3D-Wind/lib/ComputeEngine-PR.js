define([
    '../Core/BoundingRectangle',
    '../Core/Check',
    '../Core/Color',
    '../Core/defined',
    '../Core/destroyObject',
    '../Core/DeveloperError',
    '../Core/PrimitiveType',
    '../Shaders/ViewportQuadVS',
    './ClearCommand',
    './DrawCommand',
    './Framebuffer',
    './RenderState',
    './ShaderProgram'
], function (
    BoundingRectangle,
    Check,
    Color,
    defined,
    destroyObject,
    DeveloperError,
    PrimitiveType,
    ViewportQuadVS,
    ClearCommand,
    DrawCommand,
    Framebuffer,
    RenderState,
    ShaderProgram) {
        'use strict';

        /**
         * @private
         */
        function ComputeEngine(context) {
            this._context = context;
        }

        var renderStateScratch;
        var drawCommandScratch = new DrawCommand({
            primitiveType: PrimitiveType.TRIANGLES
        });
        var clearCommandScratch = new ClearCommand({
            color: new Color(0.0, 0.0, 0.0, 0.0)
        });

        // TODO: maybe I should make a pull request for MRT support in ComputeCommand?
        function createFramebuffer(context, outputTextures) {
            return new Framebuffer({
                context: context,
                colorTextures: outputTextures,
                destroyAttachments: false
            });
        }

        function createViewportQuadShader(context, fragmentShaderSource) {
            return ShaderProgram.fromCache({
                context: context,
                vertexShaderSource: ViewportQuadVS,
                fragmentShaderSource: fragmentShaderSource,
                attributeLocations: {
                    position: 0,
                    textureCoordinates: 1
                }
            });
        }

        function createRenderState(width, height) {
            if ((!defined(renderStateScratch)) ||
                (renderStateScratch.viewport.width !== width) ||
                (renderStateScratch.viewport.height !== height)) {

                renderStateScratch = RenderState.fromCache({
                    viewport: new BoundingRectangle(0, 0, width, height)
                });
            }
            return renderStateScratch;
        }

        ComputeEngine.prototype.execute = function (computeCommand) {
            //>>includeStart('debug', pragmas.debug);
            Check.defined('computeCommand', computeCommand);
            //>>includeEnd('debug');

            // This may modify the command's resources, so do error checking afterwards
            if (defined(computeCommand.preExecute)) {
                computeCommand.preExecute(computeCommand);
            }

            //>>includeStart('debug', pragmas.debug);
            if (!defined(computeCommand.fragmentShaderSource) && !defined(computeCommand.shaderProgram)) {
                throw new DeveloperError('computeCommand.fragmentShaderSource or computeCommand.shaderProgram is required.');
            }

            Check.defined('computeCommand.outputTextures', computeCommand.outputTextures);
            //>>includeEnd('debug');

            var outputTextures = computeCommand.outputTextures;

            // use first texture to determine width and height
            var width = outputTextures[0].width;
            var height = outputTextures[0].height;

            var context = this._context;
            var vertexArray = defined(computeCommand.vertexArray) ? computeCommand.vertexArray : context.getViewportQuadVertexArray();
            var shaderProgram = defined(computeCommand.shaderProgram) ? computeCommand.shaderProgram : createViewportQuadShader(context, computeCommand.fragmentShaderSource);
            var framebuffer = createFramebuffer(context, outputTextures);
            var renderState = createRenderState(width, height);
            var uniformMap = computeCommand.uniformMap;

            var clearCommand = clearCommandScratch;
            clearCommand.framebuffer = framebuffer;
            clearCommand.renderState = renderState;
            clearCommand.execute(context);

            var drawCommand = drawCommandScratch;
            drawCommand.vertexArray = vertexArray;
            drawCommand.renderState = renderState;
            drawCommand.shaderProgram = shaderProgram;
            drawCommand.uniformMap = uniformMap;
            drawCommand.framebuffer = framebuffer;
            drawCommand.execute(context);

            framebuffer.destroy();

            if (!computeCommand.persists) {
                shaderProgram.destroy();
                if (defined(computeCommand.vertexArray)) {
                    vertexArray.destroy();
                }
            }

            if (defined(computeCommand.postExecute)) {
                computeCommand.postExecute(outputTextures);
            }
        };

        ComputeEngine.prototype.isDestroyed = function () {
            return false;
        };

        ComputeEngine.prototype.destroy = function () {
            return destroyObject(this);
        };

        return ComputeEngine;
    });
