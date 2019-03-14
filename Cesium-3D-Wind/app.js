// Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmYWEyMmExOS1lYjA2LTQ1YjItOTMwMS03ZWYwMzg1MWY3NWYiLCJpZCI6NDY4OCwic2NvcGVzIjpbImFzciIsImdjIl0sImlhdCI6MTU0MTQyMDMzMX0.e5QtAVvpj2oWYIiXyN5oEsFvxF6buKxhj-oOx0L1g7M';

const fileOptions = {
    directory: 'data/',
    dataFilePrefix: 'data_',
    dataIndex: 0,
    colorTableFileName: 'colorTable.json'
}

const particleSystemOptions = {
    particlesTextureSize: 256,
    fadeOpacity: 0.95,
    dropRate: 0.003,
    dropRateBump: 0.01,
    uvMinFactor: -4.0,
    uvMaxFactor: 4.0
}

var wind3D = new Wind3D(fileOptions, particleSystemOptions);
wind3D.debug();
