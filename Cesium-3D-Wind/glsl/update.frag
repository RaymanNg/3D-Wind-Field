uniform sampler2D U;// (lon, lat*lev)
uniform sampler2D V;// (lon, lat*lev)
uniform vec3 windFieldDimensions;// (lon, lat, lev)
uniform vec3 windFieldSteps;// step of each dimension
uniform sampler2D particles;

varying vec2 textureCoordinate;

vec3 updatePosition(vec3 position, vec2 textureIndex) {
	// quick and dirty estimation for unit conversion: 
	// meters per second -> longitude latitude degrees per second
	float u = texture2D(U, textureIndex).r / (111111.0 * cos(position.x));
	float v = texture2D(V, textureIndex).r / 111111.0;
	float w = 0.0;
	vec3 windVector = vec3(u, v, w);
	
    vec3 updatedPosition = position + windVector;
	return updatedPosition;
}

void main() {
    vec4 texel = texture2D(particles, textureCoordinate); // texture coordinate must be normalized
    
	vec3 position = texel.rgb;// (lon, lat, lev)
	vec3 windFieldIndex = position;
	windFieldIndex.x = windFieldIndex.x / windFieldSteps.x;
	windFieldIndex.y = windFieldIndex.y / windFieldSteps.y; // the range of latitude is [-90, 90]
	windFieldIndex.z = windFieldIndex.z / windFieldSteps.z;
    
	vec2 textureIndex = vec2(windFieldIndex.x, windFieldIndex.y * windFieldDimensions.z + windFieldIndex.z);
	vec3 nextPosition = updatePosition(position, textureIndex);

    gl_FragColor = vec4(position.xyz, 1.0);
}
