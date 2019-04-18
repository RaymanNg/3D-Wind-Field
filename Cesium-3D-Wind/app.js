const mode = {
    debug: demo ? false : false
};

var panel = new Panel();
var wind3D = new Wind3D(
    panel.getFileOptions(),
    panel.getParticleSystemOptions(),
    panel.getDisplayOptions(),
    mode
);
