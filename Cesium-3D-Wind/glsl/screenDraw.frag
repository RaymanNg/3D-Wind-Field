uniform sampler2D screenColor;
uniform sampler2D screenDepth;

varying vec2 textureCoordinate;

void main() {
    vec4 color = texture2D(screenColor, textureCoordinate);
	float depth = texture2D(screenDepth, textureCoordinate).r;
    gl_FragColor = color;
	gl_FragDepthEXT = depth;
}