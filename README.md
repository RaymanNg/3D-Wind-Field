# 3D-Wind-Field [Demo](https://raymanng.github.io/3D-Wind-Field/demo/)
Visualize the wind on earth, powered by [Cesium JS](https://github.com/AnalyticalGraphicsInc/cesium).

More detail is in this blog post: [GPU Powered Wind Visualization With Cesium](https://cesium.com/blog/2019/04/29/gpu-powered-wind/)

## Q&A
### How to start the application?
Just create a HTTP server for the "index.html" file in the "Cesium-3D-Wind" folder.

If you have VSCode installed, I recommend to intall the "liveserver" extension. 

### How to use my own NetCDF data?
The NetCDF file is in the "data" folder, it should contains below variables:
- U (lev, lat, lon) @min @max 
- V (lev, lat, lon) @min @max

Note:
- Don't forget to change the filename in the source code ("gui.js")
- "lev", "lat", "lon" are names of dimensions, and "min", "max" are the attributes of the variable.
- The order of dimensions matter
- Use small (less than 100MB) NetCDF file if possible, or your browser may crash.

The layout of the NetCDF data:
![demo.nc](https://user-images.githubusercontent.com/18614142/58364512-26cd1e00-7ee8-11e9-8c94-1425221ec8b2.png)

Note:
- The range of longitude is `[0,360]`, not `[-180, 180]`
- netcdfjs will read the data **row by row**, so array(0) is (lon 0, lat -90)
- You must use NetCDF version 3 (NOT 4, NOT other file types like HDF or GRIB) file

For more detail, use [Panoply](https://www.giss.nasa.gov/tools/panoply/) to read the "data/demo.nc" file

### What to do if I want to use JSON file instead of NetCDF?
You can add a function for loading JSON data in the dataProcess.js, and call your JSON loading function in the exposed function loadData.

However, you should ensure that the data return from your JSON loading function should have the same structure as that of function loadNetCDF.

### How do you generate the `demo.nc` file ?
The demo data is from [NOAA Global Forecast System](https://www.ncdc.noaa.gov/data-access/model-data/model-datasets/global-forcast-system-gfs). The original data is in GRIB2 format and I used [toolsUI](https://www.unidata.ucar.edu/software/thredds/v4.5/netcdf-java/ToolsUI.html) to convert the GRIB2 file to a NetCDF V3 file.

After the conversion I used [NetCDF Operator](http://nco.sourceforge.net/#Executables) for further process of the NetCDF data. I wrote a PowerShell script(in the 'Util' folder) to extract and transform the data by making use of NetCDF Operator. You can also use this script once you setup the 'NCOPath' and 'fileToProcess' variables in the script.

### What does the "particleHeight" mean?
"particleHeight" is the distance from the surface of earth. Particles lower than the terrain will be overlapped.

### Why are some particles not overlapped by higher terrain?
Because sometimes the depth test for particles is not accurate enough. This problem is similar with [Z-fighting](https://en.wikipedia.org/wiki/Z-fighting), the cause is depth buffer does not have enough precision.

### How customize the panel ?
The panel is made with [dat.gui](https://github.com/dataarts/dat.gui) library, you can read its document and modify the gui.js as you need.

## Troubleshoot
### This demo does not work on my device
If possible, you should run this demo in Chrome on PC, because I did not test it in other browser or mobile device.

If you got into trouble on other device(for example, mobile phone), you can check your WebGL implementation in [WebGL report](https://webglreport.com/). Check the "Supported Extensions" section, below extensions are at least required:
- OES_texture_float
- WEBGL_depth_texture extension
- EXT_frag_depth

### There is no particle or world terrian after starting the demo
Please check the speed of your network connection. Open the development tools in your browser and refresh the website, then check if your browser is downloading the data in a very slow speed.

### World terrian can not be loaded
Cesium requires access token of [Cesium ION](https://cesium.com/ion/signin/) to access the WorldTerrain data, you can register an account to acquire a valid token, and use it according to the [document](https://cesium.com/docs/cesiumjs-ref-doc/Ion.html).

### I adopt the WebGL code and the demo is not working now
Unfortunately, there is no easy way to debug WebGL code, and I can't find any debugging tool for setting breakpoints in WebGL. For the moment, I suggest to use [Spector.js](https://github.com/BabylonJS/Spector.js) to figure out what is happening with your WebGL code. It can tell you the input and output of your code.

### All WMS layers failed to display
Probably the WMS URL changed, you may check the latest WMS URL by accessing NOAA's TDS server of GFS Analysis. Click the data file of the date you want (mine is 20190916_0000_000), then the WMS URL for this file will be showed in the web page. After getting the latest URL, you can update the variable "WMS_URL" in gui.js to make WMS layer display work again.

## Credits
This demo makes use of below repos:
- [CesiumJS](https://github.com/AnalyticalGraphicsInc/cesium)
- [Spector.js](https://github.com/BabylonJS/Spector.js)
- [netcdfjs](https://github.com/cheminfo-js/netcdfjs)
- A good Cesium [tutorial](https://github.com/cesiumlab/cesium-custom-primitive).

This demo makes use of TDS server of [NOAA GFS](https://www.ncdc.noaa.gov/data-access/model-data/model-datasets/global-forcast-system-gfs) for WMS layer display
