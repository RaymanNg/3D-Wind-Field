uniform sampler2D trailsColorTexture;
uniform sampler2D trailsDepthTexture;
uniform sampler2D globeDepthTexture;

varying vec2 textureCoordinate;

void main() {
    vec4 trailsColor = texture2D(trailsColorTexture, textureCoordinate);
	float trailsDepth = texture2D(trailsDepthTexture, textureCoordinate).r;
	float globeDepth = texture2D(globeDepthTexture, textureCoordinate).r;
	
	if (trailsDepth > globeDepth) {
	    gl_FragColor = trailsColor;
		gl_FragDepthEXT = trailsDepth;
	} else {
		gl_FragColor = vec4(0.0);
		gl_FragDepthEXT = globeDepth;
	}
}