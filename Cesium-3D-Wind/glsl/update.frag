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

vec3 updatePosition(vec3 position, vec2 normalizedIndex2D) {
	// quick and dirty estimation for unit conversion: 
	// meters per second -> longitude latitude degrees per second
	float u = texture2D(U, normalizedIndex2D).r;
	float v = texture2D(V, normalizedIndex2D).r;
	float w = 0.0;
	vec3 windVector = vec3(u, v, w);
	
    vec3 updatedPosition = position + windVector;
	return updatedPosition;
}

void main() {
    vec4 texel = texture2D(particles, textureCoordinate); // texture coordinate must be normalized
    
	vec3 position = texel.rgb; // (lon, lat, lev)
	vec2 normalizedIndex2D = mapPositionToNormalizedIndex2D(position);
	vec3 nextPosition = updatePosition(position, normalizedIndex2D);

    gl_FragColor = vec4(nextPosition.xyz, 1.0);
}
