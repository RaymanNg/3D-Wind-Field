precision highp sampler2D;

uniform sampler2D particles;

void main() {
	vec2 particleIndex = vec2(position.x, position.y);
    vec3 particlePosition = texture2D(particles, particleIndex).rgb;
	particlePosition = particlePosition / 100.0;
    gl_PointSize = 2.0;
    gl_Position = vec4(particlePosition, 1);
}