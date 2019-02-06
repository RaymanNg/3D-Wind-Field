uniform sampler2D colorTexture; 
uniform sampler2D depthTexture;

uniform sampler2D particleTrails;
// uniform sampler2D particleDepthTexture;

varying vec2 v_textureCoordinates; 

void main() 
{
	vec4 cesiumColor = texture2D(colorTexture, v_textureCoordinates);
	vec4 particleColor = texture2D(particleTrails, v_textureCoordinates);
	
//	float cesiumDepth = texture2D(depthTexture, v_textureCoordinates).r;
//	float particleDepth = texture2D(particleDepthTexture, v_textureCoordinates).r;
	
//	if (particleDepth > cesiumDepth) {
		gl_FragColor = cesiumColor + particleColor;
//	} else {
//		gl_FragColor = cesiumColor;
//	}
}