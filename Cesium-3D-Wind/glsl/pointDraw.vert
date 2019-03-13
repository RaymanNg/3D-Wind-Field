attribute vec2 st;

uniform sampler2D particles;

uniform sampler2D colorRamp;
varying vec4 particleColor;

vec3 convertCoordinate(vec3 lonLatLev) {
	// WGS84 (lon, lat, lev) -> ECEF (x, y, z)
	// see https://en.wikipedia.org/wiki/Geographic_coordinate_conversion#From_geodetic_to_ECEF_coordinates for detail
	vec3 cartesian = vec3(0.0);
	
	// WGS 84 geometric constants 
	float a = 6378137.0; // Semi-major axis 
	float b = 6356752.3142; // Semi-minor axis 
	float e2 = 6.69437999014e-3; // First eccentricity squared
	
	float cosLat = cos(radians(lonLatLev.y));
	float sinLat = sin(radians(lonLatLev.y));
	float cosLon = cos(radians(lonLatLev.x));
	float sinLon = sin(radians(lonLatLev.x));

	float N_Phi = a / sqrt(1.0 - e2 * sinLat * sinLat);
	float h = 10.0; // it should be high enough otherwise the particle may not pass the terrain depth test
	
	cartesian.x = (N_Phi + h) * cosLat * cosLon;
	cartesian.y = (N_Phi + h) * cosLat * sinLon;
	cartesian.z = ((b * b) / (a * a) * N_Phi + h) * sinLat;
	return cartesian;
}

void main() {
	vec2 particleIndex = st;
    vec4 texel = texture2D(particles, particleIndex);
	vec3 lonLatLev = texel.rgb;
	float relativeSpeed = texel.a;
	
	particleColor = texture2D(colorRamp, vec2(relativeSpeed, 0.0));
	
	// the range of longitude in Cesium is [-Pi, Pi]
	// but the range of longitude in my NetCDF file is [0, 360]
	// [0, 180] is corresponding to [0, 180]
	// [180, 360] is corresponding to [-180, 0]
	lonLatLev.x = mod(lonLatLev.x + 180.0, 360.0) - 180.0;
	vec3 particlePosition = convertCoordinate(lonLatLev);
	vec4 cesiumPosition = vec4(particlePosition, 1.0);
	gl_Position = czm_modelViewProjection * cesiumPosition;
	
	gl_PointSize = 1.0;
}