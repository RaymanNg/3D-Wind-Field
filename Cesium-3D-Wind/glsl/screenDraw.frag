uniform sampler2D screen;

varying vec2 textureCoordinate;

void main() {
    vec4 color = texture2D(screen, textureCoordinate);
    gl_FragColor = vec4(texture2D(screen, textureCoordinate).r, 0.0, 0.0, texture2D(screen, textureCoordinate).a);
}