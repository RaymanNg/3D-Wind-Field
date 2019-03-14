uniform sampler2D segmentsColorTexture;
uniform sampler2D segmentsDepthTexture;

uniform sampler2D currentTrailsColor;
uniform sampler2D trailsDepthTexture;

uniform float fadeOpacity;

varying vec2 textureCoordinate;

void main() {
    vec4 pointsColor = texture2D(segmentsColorTexture, textureCoordinate);	
	vec4 trailsColor = texture2D(currentTrailsColor, textureCoordinate);
	
	trailsColor = floor(fadeOpacity * 255.0 * trailsColor) / 255.0; // a hack to make sure the trailsColor will be strictly decreased
		
	float pointsDepth = texture2D(segmentsDepthTexture, textureCoordinate).r;
	float trailsDepth = texture2D(trailsDepthTexture, textureCoordinate).r;
		
	// change branching logic to math formula for performance
	// check whether trailsColor.a > 0.33
	float trailsVisible = step(0.33, trailsColor.a); 
	trailsDepth = mix(1.0, trailsDepth, trailsVisible);
	
	// equivalent statement
	// bool trailsVisible = trailsColor.a > 0.33;
	// if (!trailsVisible) trailsDepth = 1.0;

	gl_FragColor = pointsColor + trailsColor;
	gl_FragDepthEXT = min(pointsDepth, trailsDepth);
}