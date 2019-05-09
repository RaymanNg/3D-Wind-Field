uniform sampler2D randomParticlesPosition;
uniform sampler2D nextParticlesSpeed;

varying vec2 v_textureCoordinates;

void main() {
	vec4 randomParticle = texture2D(randomParticlesPosition, v_textureCoordinates);
	vec3 particleSpeed = texture2D(nextParticlesSpeed, v_textureCoordinates).rgb;
	
    if (randomParticle.a > 0.0) {
		gl_FragColor = vec4(0.0);
    } else {
		gl_FragColor = vec4(particleSpeed, 0.0);
    }
}