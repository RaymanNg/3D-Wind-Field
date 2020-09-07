// the size of UV textures: width = lon, height = lat*lev
uniform sampler2D U; // eastward wind 
uniform sampler2D V; // northward wind

uniform sampler2D currentParticlesPosition; // (lon, lat, lev)

uniform vec3 dimension; // (lon, lat, lev)
uniform vec3 minimum; // minimum of each dimension
uniform vec3 maximum; // maximum of each dimension
uniform vec3 interval; // interval of each dimension

varying vec2 v_textureCoordinates;

vec2 mapPositionToNormalizedIndex2D(vec3 lonLatLev) {
    // ensure the range of longitude and latitude
    lonLatLev.x = mod(lonLatLev.x, 360.0);
    lonLatLev.y = clamp(lonLatLev.y, -90.0, 90.0);

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

float getWindComponent(sampler2D componentTexture, vec3 lonLatLev) {
    vec2 normalizedIndex2D = mapPositionToNormalizedIndex2D(lonLatLev);
    float result = texture2D(componentTexture, normalizedIndex2D).r;
    return result;
}

float interpolateTexture(sampler2D componentTexture, vec3 lonLatLev) {
    float lon = lonLatLev.x;
    float lat = lonLatLev.y;
    float lev = lonLatLev.z;

    float lon0 = floor(lon / interval.x) * interval.x;
    float lon1 = lon0 + 1.0 * interval.x;
    float lat0 = floor(lat / interval.y) * interval.y;
    float lat1 = lat0 + 1.0 * interval.y;

    float lon0_lat0 = getWindComponent(componentTexture, vec3(lon0, lat0, lev));
    float lon1_lat0 = getWindComponent(componentTexture, vec3(lon1, lat0, lev));
    float lon0_lat1 = getWindComponent(componentTexture, vec3(lon0, lat1, lev));
    float lon1_lat1 = getWindComponent(componentTexture, vec3(lon1, lat1, lev));

    float lon_lat0 = mix(lon0_lat0, lon1_lat0, lon - lon0);
    float lon_lat1 = mix(lon0_lat1, lon1_lat1, lon - lon0);
    float lon_lat = mix(lon_lat0, lon_lat1, lat - lat0);
    return lon_lat;
}

vec3 linearInterpolation(vec3 lonLatLev) {
    // https://en.wikipedia.org/wiki/Bilinear_interpolation
    float u = interpolateTexture(U, lonLatLev);
    float v = interpolateTexture(V, lonLatLev);
    float w = 0.0;
    return vec3(u, v, w);
}

void main() {
    // texture coordinate must be normalized
    vec3 lonLatLev = texture2D(currentParticlesPosition, v_textureCoordinates).rgb;
    vec3 windVector = linearInterpolation(lonLatLev);
    gl_FragColor = vec4(windVector, 0.0);
}