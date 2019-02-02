precision highp sampler2D;

uniform sampler2D screen;

varying vec2 textureCoordinate;

void main() {
    vec4 color = texture2D(screen, textureCoordinate);
    gl_FragColor = color;
}