varying vec2 textureCoordinate;

void main() {
    textureCoordinate = uv; // attribute uv will be added implicitly by three.js
    gl_Position = vec4(position.xy, 0.0, 1.0); // attribute position will be added implicitly by three.js
}