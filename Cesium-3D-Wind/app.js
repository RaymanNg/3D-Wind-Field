const mode = {
    debug: demo ? false : true
};

var panel = new Panel();
var wind3D = new Wind3D(
    panel,
    mode
);
