attribute vec2 st;

uniform sampler2D particles;

vec3 convertCoordinate(vec3 lonLatLev) {
	vec3 cartesian = vec3(0.0);
	float R = 6371.0 * 1000.0;
	cartesian.x = R * cos(lonLatLev.y) * cos(lonLatLev.x);
	cartesian.y = R * cos(lonLatLev.y) * sin(lonLatLev.x);
	cartesian.z = R *sin(lonLatLev.y);
	return cartesian;
}

void main() {
	vec2 particleIndex = st;
    vec3 particlePosition = texture2D(particles, particleIndex).rgb;
	particlePosition = convertCoordinate(particlePosition);
	
	vec4 cesiumPosition = vec4(particlePosition, 1.0);
	cesiumPosition = czm_modelViewProjection * cesiumPosition;
	cesiumPosition = normalize(cesiumPosition);
	
    gl_PointSize = 2.0;
    gl_Position = vec4(cesiumPosition.xyz, 1);
}