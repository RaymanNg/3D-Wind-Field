precision highp sampler2D;

uniform sampler2D U;// (lon, lat*lev)
uniform sampler2D V;// (lon, lat*lev)
uniform vec3 windFieldDimensions;// (lon, lat, lev)
uniform sampler2D particles;

varying vec2 textureCoordinate;

void main() {
    vec4 texel = texture2D(particles, textureCoordinate); // texture coordinate must be normalized
    vec3 position = texel.rgb;// (lon, lat, lev)
    
	vec2 index = vec2(position.x, position.y * windFieldDimensions.y + position.z);
	float u = texture2D(U, index).r;
	float v = texture2D(V, index).r;
	float w = 0.0;
	vec3 windVector = vec3(u, v, w);
	
    vec3 nextPosition = position + windVector;
    gl_FragColor = vec4(nextPosition, 1.0);
}
