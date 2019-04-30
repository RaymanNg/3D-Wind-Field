# 3D-Wind-Field [Demo](https://raymanng.github.io/3D-Wind-Field/demo/)
Visualize the wind on earth, powered by [Cesium JS](https://github.com/AnalyticalGraphicsInc/cesium).

More detail is in this blog post:[GPU Powered Wind Visualization With Cesium](https://cesium.com/blog/2019/04/29/gpu-powered-wind/)

## How to start the application
Just create a HTTP server for the "index.html" file in the "Cesium-3D-Wind" folder.

If you have VSCode installed, I recommend to intall the "liveserver" extension. 

Besides, remember to modify the "runtimeExecutable" option in ".vscode\launch.json" file before 
starting debug in VSCode.

## Note
You might want to modify the default parameters for a better visualization result, parameters can be changed in the left panel.

## Rerference
I find a good tutorial about doing custom render in Cesium https://github.com/cesiumlab/cesium-custom-primitive.
