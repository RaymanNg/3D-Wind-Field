# 3D-Wind-Field [Demo](https://raymanng.github.io/3D-Wind-Field/demo/)
Visualize the wind on earth, powered by [Cesium JS](https://github.com/AnalyticalGraphicsInc/cesium).

More detail is in this blog post: [GPU Powered Wind Visualization With Cesium](https://cesium.com/blog/2019/04/29/gpu-powered-wind/)

## How to start the application
Just create a HTTP server for the "index.html" file in the "Cesium-3D-Wind" folder.

If you have VSCode installed, I recommend to intall the "liveserver" extension. 

Besides, remember to modify the "runtimeExecutable" option in ".vscode\launch.json" file before 
starting debug in VSCode.

## How to use your own NetCDF data
The NetCDF file is in the "data" folder, it should contains below variables:
- U (lev, lat, lon) @min @max 
- V (lev, lat, lon) @min @max

"lev", "lat", "lon" are names of dimensions, and "min", "max" are the attributes of the variable.
For more detail, use [Panoply](https://www.giss.nasa.gov/tools/panoply/) to read the "data/demo.nc" file

please note that:
- You must use NetCDF version 3 (NOT 4, NOT other file types like HDF or GRIB) file
- The order of dimensions matter
- Use small (less than 100MB) NetCDF file if possible, or your browser may crash. You may want to use NCO (NetCDF Operator) or CDO (Climate Data Operator) to split the NetCDF data
- Don't forget to change the filename in the source code ("gui.js")

### Data layout
![demo.nc](https://user-images.githubusercontent.com/18614142/58364512-26cd1e00-7ee8-11e9-8c94-1425221ec8b2.png)

Note: 
- netcdfjs will read the data row by row, so array(0) is (lon 0, lat -90)
- The range of longitude is `[0,360]`, not `[-180, 180]`

## Note
- The demo data is from [NOAA Global Forecast System](https://www.ncdc.noaa.gov/data-access/model-data/model-datasets/global-forcast-system-gfs).
- The original data is in GRIB2 format and I used [toolsUI](https://www.unidata.ucar.edu/software/thredds/v4.5/netcdf-java/ToolsUI.html) to convert the GRIB2 file to a NetCDF V3 file.
- You might want to modify the default parameters for a better visualization result, parameters can be changed in the left panel.
- If possible, you should run this demo in Chrome on PC, because I did not test it in other browser or mobile device.

## Credits
This demo makes use of below repos:
- [CesiumJS](https://github.com/AnalyticalGraphicsInc/cesium)
- [Spector.js](https://github.com/BabylonJS/Spector.js)
- [netcdfjs](https://github.com/cheminfo-js/netcdfjs)
- A good Cesium [tutorial](https://github.com/cesiumlab/cesium-custom-primitive).
