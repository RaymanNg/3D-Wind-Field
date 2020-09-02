uniform sampler2D currentParticlesSpeed; // (u, v, w, normalization)
uniform sampler2D particlesWind;

// used to calculate the wind norm
uniform vec2 uSpeedRange; // (min, max);
uniform vec2 vSpeedRange;
uniform float pixelSize;
uniform float speedFactor;

varying vec2 v_textureCoordinates;

float calculateWindNorm(vec3 speed) {
    vec3 percent = vec3(0.0);
    percent.x = (speed.x - uSpeedRange.x) / (uSpeedRange.y - uSpeedRange.x);
    percent.y = (speed.y - vSpeedRange.x) / (vSpeedRange.y - vSpeedRange.x);
    float normalization = length(percent);

    return normalization;
}

void main() {
    // texture coordinate must be normalized
    vec3 currentSpeed = texture2D(currentParticlesSpeed, v_textureCoordinates).rgb;
    vec3 windVector = texture2D(particlesWind, v_textureCoordinates).rgb;

    vec4 nextSpeed = vec4(speedFactor * pixelSize * windVector, calculateWindNorm(windVector));
    gl_FragColor = nextSpeed;
}