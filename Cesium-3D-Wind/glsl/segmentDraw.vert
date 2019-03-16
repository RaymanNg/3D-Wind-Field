attribute vec3 position;

uniform sampler2D fromParticlesRandomized;
uniform sampler2D toParticlesRandomized;
uniform sampler2D particlesRelativeSpeed;

varying float relativeSpeed;

vec3 convertCoordinate(vec3 lonLatLev) {
    // WGS84 (lon, lat, lev) -> ECEF (x, y, z)
    // see https://en.wikipedia.org/wiki/Geographic_coordinate_conversion#From_geodetic_to_ECEF_coordinates for detail

    // WGS 84 geometric constants 
    float a = 6378137.0; // Semi-major axis 
    float b = 6356752.3142; // Semi-minor axis 
    float e2 = 6.69437999014e-3; // First eccentricity squared

    float latitude = radians(lonLatLev.y);
    float longitude = radians(lonLatLev.x);

    float cosLat = cos(latitude);
    float sinLat = sin(latitude);
    float cosLon = cos(longitude);
    float sinLon = sin(longitude);

    float N_Phi = a / sqrt(1.0 - e2 * sinLat * sinLat);
    float h = 100.0; // it should be high enough otherwise the particle may not pass the terrain depth test

    vec3 cartesian = vec3(0.0);
    cartesian.x = (N_Phi + h) * cosLat * cosLon;
    cartesian.y = (N_Phi + h) * cosLat * sinLon;
    cartesian.z = ((b * b) / (a * a) * N_Phi + h) * sinLat;
    return cartesian;
}

void main() {
    vec2 particleIndex = position.xy;
    vec4 texel = vec4(0.0);
    if (position.z < 1.0) {
        texel = texture2D(fromParticlesRandomized, particleIndex);
    } else {
        texel = texture2D(toParticlesRandomized, particleIndex);
    }

    // the range of longitude in Cesium is [-180, 180] but the range of longitude in the NetCDF file is [0, 360]
    // [0, 180] is corresponding to [0, 180] and [180, 360] is corresponding to [-180, 0
    vec3 lonLatLev = texel.rgb;
    lonLatLev.x = mod(lonLatLev.x + 180.0, 360.0) - 180.0;
    vec3 particlePosition = convertCoordinate(lonLatLev);
    vec4 cesiumPosition = vec4(particlePosition, 1.0);

    relativeSpeed = length(texture2D(particlesRelativeSpeed, particleIndex).rgb);

    gl_Position = czm_modelViewProjection * cesiumPosition;
}