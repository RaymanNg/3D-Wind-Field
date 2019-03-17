// this file must use UNIX Style End of Line
// otherwise the regex for #extension in Cesium.ShaderSource won't work
#extension GL_EXT_draw_buffers: enable

// the size of UV textures: width = lon, height = lat*lev
uniform sampler2D U; // eastward wind 
uniform sampler2D V; // northward wind

uniform sampler2D particlesPosition; // (lon, lat, lev)

uniform vec3 dimension; // (lon, lat, lev)
uniform vec3 minimum; // minimum of each dimension
uniform vec3 maximum; // maximum of each dimension
uniform vec3 interval; // interval of each dimension

// use to map wind speed to suitable new range
uniform vec3 uSpeedRange; // (min, max, max - min);
uniform vec3 vSpeedRange;
uniform vec2 relativeSpeedRange;

varying vec2 v_textureCoordinates;

vec2 mapPositionToNormalizedIndex2D(vec3 lonLatLev) {
    // ensure the longitude is in [0, 360]
    lonLatLev.x = mod(lonLatLev.x, 360.0);

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

    vec2 index2D = vec2(index3D.x, index3D.z * dimension.y + index3D.y);
    vec2 normalizedIndex2D = vec2(index2D.x / dimension.x, index2D.y / (dimension.y * dimension.z));
    return normalizedIndex2D;
}

vec3 getWindVector(vec3 lonLatLev) {
    vec2 normalizedIndex2D = mapPositionToNormalizedIndex2D(lonLatLev);
    float u = texture2D(U, normalizedIndex2D).r;
    float v = texture2D(V, normalizedIndex2D).r;
    float w = 0.0;
    return vec3(u, v, w);
}

vec3 interpolate(vec3 lonLatLev) {
    vec2 lonLat = lonLatLev.xy;
    float lev = lonLatLev.z;

    vec2 topLeft = vec2(floor(lonLat.x), ceil(lonLat.y));
    vec3 topLeftWindVec = getWindVector(vec3(topLeft, lev));

    vec2 topRight = ceil(lonLat);
    vec3 topRightWindVec = getWindVector(vec3(topRight, lev));

    vec2 bottomLeft = floor(lonLat);
    vec3 bottomLeftWindVec = getWindVector(vec3(bottomLeft, lev));

    vec2 bottomRight = vec2(ceil(lonLat.x), floor(lonLat.y));
    vec3 bottomRightWindVec = getWindVector(vec3(bottomRight, lev));

    // manual bilinear interpolation
    vec2 coef_a = abs(fract(lonLat));
    vec3 topLeftRightMix = mix(topLeftWindVec, topRightWindVec, coef_a.x);
    vec3 bottomLeftRightMix = mix(bottomLeftWindVec, bottomRightWindVec, coef_a.x);
    vec3 mixWindVec = mix(bottomLeftRightMix, topLeftRightMix, coef_a.y);

    return mixWindVec;
}

vec2 lengthOfLonLat(vec3 lonLatLev) {
    // unit conversion: meters -> longitude latitude degrees
    // see https://en.wikipedia.org/wiki/Geographic_coordinate_system#Length_of_a_degree for detail

    // Calculate the length of a degree of latitude and longitude in meters
    float latitude = radians(lonLatLev.y);

    float term1 = 111132.92;
    float term2 = 559.82 * cos(2.0 * latitude);
    float term3 = 1.175 * cos(4.0 * latitude);
    float term4 = 0.0023 * cos(6.0 * latitude);
    float latLen = term1 - term2 + term3 - term4;

    float term5 = 111412.84 * cos(latitude);
    float term6 = 93.5 * cos(3.0 * latitude);
    float term7 = 0.118 * cos(5.0 * latitude);
    float longLen = term5 - term6 + term7;

    return vec2(longLen, latLen);
}

void update(vec3 lonLatLev, vec3 windVector) {
    vec3 percent = vec3(0.0);
    percent.x = (windVector.x - uSpeedRange.x) / uSpeedRange.z;
    percent.y = (windVector.y - vSpeedRange.x) / vSpeedRange.z;

    windVector.x = mix(relativeSpeedRange.x, relativeSpeedRange.y, percent.x);
    windVector.y = mix(relativeSpeedRange.x, relativeSpeedRange.y, percent.y);

    vec2 lonLatLen = lengthOfLonLat(lonLatLev);
    float u = windVector.x / lonLatLen.x;
    float v = windVector.y / lonLatLen.y;
    float w = 0.0;
    vec3 windVectorInLonLatLev = vec3(u, v, w);

    vec3 nextParticle = lonLatLev + windVectorInLonLatLev;

    gl_FragData[0] = vec4(nextParticle, 0.0);
    gl_FragData[1] = vec4(percent, 0.0);
}

void main() {
    // texture coordinate must be normalized
    vec3 lonLatLev = texture2D(particlesPosition, v_textureCoordinates).rgb;
    vec3 windVector = interpolate(lonLatLev);

    update(lonLatLev, windVector);
}