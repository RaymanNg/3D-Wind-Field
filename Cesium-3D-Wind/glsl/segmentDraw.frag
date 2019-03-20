uniform sampler2D colorTable;

varying float relativeSpeed;
varying float offsetLength;

void main() {
    gl_FragColor = texture2D(colorTable, vec2(relativeSpeed, 0.0));
}