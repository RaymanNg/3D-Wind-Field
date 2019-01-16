precision highp sampler2D;

uniform sampler2D particlePoints;
uniform sampler2D previousTrails;
uniform float fadeOpacity;

varying vec2 textureCoordinate;

void main() {
    vec4 color = texture2D(particlePoints, textureCoordinate);
	vec4 backgroundColor = texture2D(previousTrails, textureCoordinate);
	backgroundColor = floor(fadeOpacity * 255.0 * backgroundColor) / 255.0; // a hack to make sure the backgroundColor will be strictly decreasing
    gl_FragColor = color + backgroundColor;
}