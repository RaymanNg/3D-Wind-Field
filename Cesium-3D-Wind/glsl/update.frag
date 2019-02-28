uniform vec3 dimension; // (lon, lat, lev)
uniform vec3 minimum; // minimum of each dimension
uniform vec3 maximum; // maximum of each dimension
uniform vec3 interval; // interval of each dimension

// the size of UV textures: width = lon, height = lat*lev
uniform sampler2D U; // eastward wind 
uniform sampler2D V; // northward wind

uniform sampler2D particles;

varying vec2 textureCoordinate;

vec2 mapPositionToNormalizedIndex2D(vec3 lonLatLev) {	
	vec3 index3D = vec3(0.0);
	index3D.x = (lonLatLev.x - minimum.x) / interval.x;
	index3D.y = (lonLatLev.y - minimum.y) / interval.y;
	index3D.z = (lonLatLev.z - minimum.z) / interval.z;
	
	// the st texture coordinate corresponding to (col, row) index
	// example
	// data array is [0, 1, 2, 3, 4, 5], width = 3, height = 2
	// the content of texture will be
	// t 1.0
	//    |  3 4 5
	//    |
	//    |  0 1 2
	//   0.0------1.0 s

	vec2 index2D = vec2(index3D.x, index3D.y * dimension.z + index3D.z);
	vec2 normalizedIndex2D = vec2(index2D.x / dimension.x, index2D.y / (dimension.y * dimension.z));
	return normalizedIndex2D;
}

vec3 updatePosition(vec3 lonLatLev, vec2 normalizedIndex2D) {
	// unit conversion: meters -> longitude latitude degrees
	// see https://en.wikipedia.org/wiki/Geographic_coordinate_system#Length_of_a_degree for detail
	
	// Calculate the length of a degree of latitude and longitude in meters
	float term1 = 111132.92;
	float term2 = 559.82 * cos(2.0 * lonLatLev.y);
	float term3 = 1.175 * cos(4.0 * lonLatLev.y);
	float term4 = 0.0023 * cos(6.0 * lonLatLev.y);
    float latLen = term1 - term2 + term3 - term4;
	
	float term5 = 111412.84 * cos(lonLatLev.y);
	float term6 = 93.5 * cos(3.0 * lonLatLev.y);
	float term7 = 0.118 * cos(5.0 * lonLatLev.y);
    float longLen = term5 - term6 + term7;
	
	float u = texture2D(U, normalizedIndex2D).r / longLen;
	float v = texture2D(V, normalizedIndex2D).r / latLen;
	float w = 0.0;
	vec3 windVector = vec3(u, v, w);
	
    vec3 updatedPosition = lonLatLev + windVector;
	return updatedPosition;
}

void main() {
    vec4 texel = texture2D(particles, textureCoordinate); // texture coordinate must be normalized
    
	vec3 lonLatLev = texel.rgb;
	vec2 normalizedIndex2D = mapPositionToNormalizedIndex2D(lonLatLev);
	vec3 nextPosition = updatePosition(lonLatLev, normalizedIndex2D);

    gl_FragColor = vec4(nextPosition.xyz, 1.0);
}
