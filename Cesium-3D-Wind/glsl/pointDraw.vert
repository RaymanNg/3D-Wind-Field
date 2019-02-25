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

float rand(vec2 seed){
    return fract(sin(dot(seed.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
	vec2 particleIndex = st;
    vec3 particlePosition = texture2D(particles, particleIndex).rgb;
	particlePosition = vec3(360.0*rand(st.xy), 90.0*rand(st.yx), 0.0);
	particlePosition = convertCoordinate(particlePosition);
	
	vec4 cesiumPosition = vec4(particlePosition, 1.0);
	cesiumPosition = czm_modelViewProjection * cesiumPosition;
	cesiumPosition.xyz = cesiumPosition.xyz / cesiumPosition.w;
	
    gl_PointSize = 1.0;
    gl_Position = vec4(cesiumPosition.xyz, 1.0);
}