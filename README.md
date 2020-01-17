# 3D-Wind-Field [Demo](https://raymanng.github.io/3D-Wind-Field/demo/)
Visualize the wind on earth, powered by [Cesium JS](https://github.com/AnalyticalGraphicsInc/cesium).

More detail is in this blog post: [GPU Powered Wind Visualization With Cesium](https://cesium.com/blog/2019/04/29/gpu-powered-wind/)

## FAQ
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

### How do you generate the `demo.nc` file ?
The demo data is from [NOAA Global Forecast System](https://www.ncdc.noaa.gov/data-access/model-data/model-datasets/global-forcast-system-gfs). The original data is in GRIB2 format and I used [toolsUI](https://www.unidata.ucar.edu/software/thredds/v4.5/netcdf-java/ToolsUI.html) to convert the GRIB2 file to a NetCDF V3 file.

You can use NCO (NetCDF Operator) for further process of the NetCDF data. I have already wrote some scripts  to extract and transform the data by making use of NCO. You can check the 'Util' folder for detail.

### How do particles get colored?
The particles colors are defined in the `colorTable.json` file, and this demo uses the color table "GMT_panoply" in [NCL Graphics](https://www.ncl.ucar.edu/Document/Graphics/color_table_gallery.shtml).

### How customize the panel ?
The panel is made with [dat.gui](https://github.com/dataarts/dat.gui) library, you can read its document and modify the gui.js as you need.

## Troubleshoot
### This demo does not work on my device
If possible, you should run this demo in Chrome on PC, because I did not test it in other browser or mobile device.

If you got into trouble on other device(for example, mobile phone), you can check your WebGL implementation in [WebGL report](https://webglreport.com/). Check the "Supported Extensions" section, below extensions are required:
- OES_texture_float
- WEBGL_depth_texture extension
- EXT_frag_depth

### I adopt the WebGL code and the demo is not working now
Unfortunately, there is no easy way to debug WebGL code, and I can't find any debugging tool for setting breakpoints in WebGL. For the moment, I suggest to use [Spector.js](https://github.com/BabylonJS/Spector.js)  to figure out what is happening with your WebGL code. It can tell you the input and output of your code.

## Credits
This demo makes use of below repos:
- [CesiumJS](https://github.com/AnalyticalGraphicsInc/cesium)
- [Spector.js](https://github.com/BabylonJS/Spector.js)
- [netcdfjs](https://github.com/cheminfo-js/netcdfjs)
- A good Cesium [tutorial](https://github.com/cesiumlab/cesium-custom-primitive).
