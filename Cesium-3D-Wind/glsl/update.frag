// the size of UV textures: width = lon, height = lat*lev
uniform sampler2D U; // eastward wind 
uniform sampler2D V; // northward wind

uniform sampler2D particles;

uniform vec3 dimension; // (lon, lat, lev)
uniform vec3 minimum; // minimum of each dimension
uniform vec3 maximum; // maximum of each dimension
uniform vec3 interval; // interval of each dimension

// use to map wind speed to suitable new range
uniform vec3 uSpeedRange; // (min, max, max - min);
uniform vec3 vSpeedRange;
uniform vec2 relativeSpeedRange;

// range (min, max)
uniform vec2 lonRange;
uniform vec2 latRange;

// drop rate is a chance a particle will restart at random position to avoid degeneration
uniform float dropRate;
uniform float dropRateBump;

varying vec2 textureCoordinate;

// pseudo-random generator
const vec3 randomConstants = vec3(12.9898, 78.233, 4375.85453);
const vec2 normalRange = vec2(0.0, 1.0);
float rand(vec2 seed, vec2 range) {
    float temp = dot(randomConstants.xy, seed);
    temp = fract(sin(temp) * (randomConstants.z + temp));
    return temp * (range.y - range.x) + range.x;
}

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

vec2 lengthOfLonLat(vec3 lonLatLev) {
    // unit conversion: meters -> longitude latitude degrees
    // see https://en.wikipedia.org/wiki/Geographic_coordinate_system#Length_of_a_degree for detail

    // Calculate the length of a degree of latitude and longitude in meters
    float lat = radians(lonLatLev.y);

    float term1 = 111132.92;
    float term2 = 559.82 * cos(2.0 * lat);
    float term3 = 1.175 * cos(4.0 * lat);
    float term4 = 0.0023 * cos(6.0 * lat);
    float latLen = term1 - term2 + term3 - term4;

    float term5 = 111412.84 * cos(lat);
    float term6 = 93.5 * cos(3.0 * lat);
    float term7 = 0.118 * cos(5.0 * lat);
    float longLen = term5 - term6 + term7;

    return vec2(longLen, latLen);
}

vec2 getWindVector(vec3 lonLatLev) {
    vec2 normalizedIndex2D = mapPositionToNormalizedIndex2D(lonLatLev);
    float u = texture2D(U, normalizedIndex2D).r;
    float v = texture2D(V, normalizedIndex2D).r;
    return vec2(u, v);
}

vec2 interpolate(vec3 lonLatLev) {
    vec2 lonLat = lonLatLev.xy;
    float lev = lonLatLev.z;

    vec2 topLeft = vec2(floor(lonLat.x), ceil(lonLat.y));
    vec2 topLeftWindVec = getWindVector(vec3(topLeft, lev));

    vec2 topRight = ceil(lonLat);
    vec2 topRightWindVec = getWindVector(vec3(topRight, lev));

    vec2 bottomLeft = floor(lonLat);
    vec2 bottomLeftWindVec = getWindVector(vec3(bottomLeft, lev));

    vec2 bottomRight = vec2(ceil(lonLat.x), floor(lonLat.y));
    vec2 bottomRightWindVec = getWindVector(vec3(bottomRight, lev));

    // manual bilinear interpolation
    vec2 coef_a = abs(fract(lonLat));
    vec2 topLeftRightMix = mix(topLeftWindVec, topRightWindVec, coef_a.x);
    vec2 bottomLeftRightMix = mix(bottomLeftWindVec, bottomRightWindVec, coef_a.x);
    vec2 mixWindVec = mix(bottomLeftRightMix, topLeftRightMix, coef_a.y);

    return mixWindVec;
}

vec4 update(vec3 lonLatLev, vec2 normalizedIndex2D) {
    vec2 mixWindVec = interpolate(lonLatLev);

    vec2 percent = vec2((mixWindVec.x - uSpeedRange.x) / uSpeedRange.z,
        (mixWindVec.y - vSpeedRange.x) / vSpeedRange.z);
    mixWindVec.x = mix(relativeSpeedRange.x, relativeSpeedRange.y, percent.x);
    mixWindVec.y = mix(relativeSpeedRange.x, relativeSpeedRange.y, percent.y);

    vec2 lonLatLen = lengthOfLonLat(lonLatLev);
    float u = mixWindVec.x / lonLatLen.x;
    float v = mixWindVec.y / lonLatLen.y;
    float w = 0.0;
    vec3 windVector = vec3(u, v, w);

    // (lon, lat, lev, relativeSpeed)
    vec4 updatedParticle = vec4(0.0);
    updatedParticle.xyz = lonLatLev + windVector;

    float relativeSpeed = length(percent);
    updatedParticle.w = relativeSpeed;

    vec2 seed = (lonLatLev.xy + textureCoordinate) * relativeSpeed;
    float relativeDropRate = dropRate + relativeSpeed * dropRateBump;

    // change branching logic to math formula for performance
    // check whether random value > 1.0 - relativeDropRate
    float drop = step(1.0 - relativeDropRate, rand(seed, normalRange));

    // ensure the longitude is in [0, 360]
    float randomLon = mod(rand(seed + 1.3, lonRange), 360.0);
    float randomLat = rand(seed + 2.1, latRange);

    vec4 randomParticle = vec4(randomLon, randomLat, updatedParticle.z, 0.0);
    vec4 nextParticle = mix(updatedParticle, randomParticle, drop);
    // equivalent statement
    // if (rand(seed) > 1.0 - relativeDropRate) {
    //		nextParticle = randomParticle;
    // } else {
    //		nextParticle = updatedParticle;
    // }

    return nextParticle;
}

void main() {
    vec4 texel = texture2D(particles, textureCoordinate); // texture coordinate must be normalized

    vec3 lonLatLev = texel.rgb;
    vec2 normalizedIndex2D = mapPositionToNormalizedIndex2D(lonLatLev);
    vec4 nextParticle = update(lonLatLev, normalizedIndex2D);

    gl_FragColor = vec4(nextParticle);
}