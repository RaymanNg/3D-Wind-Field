precision highp sampler2D;

uniform sampler2D U;// (lon, lat*lev)
uniform sampler2D V;// (lon, lat*lev)
uniform vec3 windFieldDimensions;// (lon, lat, lev)
uniform vec3 windFieldSteps;// step of each dimension
uniform sampler2D particles;

varying vec2 textureCoordinate;

void main() {
    vec4 texel = texture2D(particles, textureCoordinate); // texture coordinate must be normalized
    
	vec3 position = texel.rgb;// (lon, lat, lev)
	vec3 windFieldIndex = position;
	windFieldIndex.x = windFieldIndex.x/windFieldSteps.x;
	windFieldIndex.y = windFieldIndex.y/windFieldSteps.y;
	windFieldIndex.z = windFieldIndex.z/windFieldSteps.z;
    
	vec2 textureIndex = vec2(windFieldIndex.x, windFieldIndex.y * windFieldDimensions.y + windFieldIndex.z);
	// quick and dirty estimate for unit conversion lon lat -> meter
	float u = texture2D(U, textureIndex).r / (111111.0 * cos(position.x));
	float v = texture2D(V, textureIndex).r / 111111.0;
	float w = 0.0;
	vec3 windVector = vec3(u, v, w);
	
    vec3 nextPosition = position + windVector;
    gl_FragColor = vec4(nextPosition, 1.0);
}
