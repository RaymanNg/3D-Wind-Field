uniform sampler2D currentParticlesSpeed; // (u, v, w)
uniform sampler2D particlesWind; // (u, v, w)

// use to calculate the relative speed
uniform vec2 uSpeedRange; // (min, max);
uniform vec2 vSpeedRange;
uniform float pixelSize;
uniform float speedFactor;

varying vec2 v_textureCoordinates;

vec3 calcRelativeSpeed(vec3 speed) {
    vec3 percent = vec3(0.0);
    percent.x = (speed.x - uSpeedRange.x) / (uSpeedRange.y - uSpeedRange.x);
    percent.y = (speed.y - vSpeedRange.x) / (vSpeedRange.y - vSpeedRange.x);

    float minRelativeSpeed = -speedFactor * pixelSize;
    float maxRelativeSpeed = speedFactor * pixelSize;

	vec3 relativeSpeed = vec3(0.0);
    relativeSpeed.x = mix(minRelativeSpeed, maxRelativeSpeed, percent.x);
    relativeSpeed.y = mix(minRelativeSpeed, maxRelativeSpeed, percent.y);
	return relativeSpeed;
}

void main() {
    // texture coordinate must be normalized
    vec3 currentSpeed = texture2D(currentParticlesSpeed, v_textureCoordinates).rgb;
	vec3 windVector = texture2D(particlesWind, v_textureCoordinates).rgb;
	
	vec3 nextSpeed = calcRelativeSpeed(windVector);
	gl_FragColor = vec4(nextSpeed, 0.0);
}