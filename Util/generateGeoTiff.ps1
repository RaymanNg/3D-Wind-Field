if (!($env:Path.split(";") -match "GISInternals")) {
    $env:Path += ";$env:GIS_INTERNALS_PATH\bin"
}

$GDALtranslate = "$env:GIS_INTERNALS_PATH\bin\gdal\apps\gdal_translate.exe"
$GDALwarp = "$env:GIS_INTERNALS_PATH\bin\gdal\apps\gdalwarp.exe"

$filePath = "C:\Users\Rayman\Downloads"
$dataDate = "20180916"

$scaleVariableArray = 
"Wind_speed_gust_surface",
"Temperature_surface",
"Pressure_surface",
"Precipitable_water_entire_atmosphere_single_layer"

for ($i = 0; $i -lt $scaleVariableArray.Length; $i++) {
    $variableName = $scaleVariableArray[$i]
    $outputFile = "$filePath\$variableName" + "_$dataDate.tif"
    & $GDALtranslate -of "GTiff" -ot "Byte" NETCDF:"$filePath\scaled.nc":$variableName "$filePath\$i.tif"
    & $GDALwarp -t_srs "WGS84" -wo SOURCE_EXTRA=1000 --config CENTER_LONG 0 "$filePath\$i.tif" "$outputFile"
}