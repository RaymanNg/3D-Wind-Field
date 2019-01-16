precision highp sampler2D;

uniform sampler2D windField;// (lon, lat*lev)
uniform vec3 windFieldDimensions;// (lon, lat, lev)
uniform sampler2D particles;

varying vec2 textureCoordinate;

void main() {
    vec4 texel = texture2D(particles, textureCoordinate); // texture coordinate must be normalized
    vec3 position = texel.rgb;// (lon, lat, lev)
    
	vec2 index = vec2(position.x, position.y * windFieldDimensions.y + position.z);
	vec3 windVector = texture2D(windField, index).rgb;
	
    vec3 nextPosition = position + 5.0*windVector;
    gl_FragColor = vec4(nextPosition, 1.0);
}
