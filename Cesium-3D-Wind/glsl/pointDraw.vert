attribute vec2 st;

uniform sampler2D particles;

vec3 convertCoordinate(vec3 lonLatLev) {
	vec3 cartesian = vec3(0.0);
	
	float cosLat = cos(radians(lonLatLev.y));
	float sinLat = sin(radians(lonLatLev.y));
	float cosLon = cos(radians(lonLatLev.x));
	float sinLon = sin(radians(lonLatLev.x));
	
	float rad = 6378137.0;
	float f = 1.0 / 298.257224;
	float C = 1.0 / sqrt(cosLat * cosLat + (1.0 - f) * (1.0 - f) * sinLat * sinLat);
	float S = (1.0 - f) * (1.0 - f) * C;
	float h = 0.0;
	
	cartesian.x = (rad * C + h) * cosLat * cosLon;
	cartesian.y = (rad * C + h) * cosLat * sinLon;
	cartesian.z = (rad * S + h) * sinLat;
	return cartesian;
}

void main() {
	vec2 particleIndex = st;
    vec3 particlePosition = texture2D(particles, particleIndex).rgb;
	particlePosition = convertCoordinate(particlePosition);
	
	vec4 cesiumPosition = vec4(particlePosition, 1.0);
	gl_Position = czm_modelViewProjection * cesiumPosition;
	
	gl_PointSize = 2.0;
}