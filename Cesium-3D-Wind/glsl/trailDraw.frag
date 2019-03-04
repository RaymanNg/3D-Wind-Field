uniform sampler2D particlePointsColor;
uniform sampler2D pointsDepthTexture;

uniform sampler2D currentTrailsColor;
uniform sampler2D trailsDepthTexture;

uniform float fadeOpacity;

varying vec2 textureCoordinate;

void main() {
    vec4 pointsColor = texture2D(particlePointsColor, textureCoordinate);	
	vec4 trailsColor = texture2D(currentTrailsColor, textureCoordinate);
	trailsColor = floor(fadeOpacity * 255.0 * trailsColor) / 255.0; // a hack to make sure the trailsColor will be strictly decreased
	
	float pointsdepth = texture2D(pointsDepthTexture, textureCoordinate).r;
	float trailsDepth = texture2D(trailsDepthTexture, textureCoordinate).r;
	
	if (pointsColor.r > 0.99) { // to test pointsColor.r == 1.0
		gl_FragColor = pointsColor;
		gl_FragDepthEXT = pointsdepth;
	} else {
		gl_FragColor = trailsColor;
		gl_FragDepthEXT = trailsDepth;
	}
}