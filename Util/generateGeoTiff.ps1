$GISIntervalsPath = $env:My_GIS_Internals_Path
. $GISIntervalsPath\SDKShell.ps1 "setenv"

Add-Type -AssemblyName Microsoft.VisualBasic
function Remove-TempFile($filePath) {
    Get-ChildItem -Path $filePath -Filter "tempFile*" | ForEach-Object {
        $fileName = $_.name
        [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile("$filePath\$fileName ", 'OnlyErrorDialogs', 'SendToRecycleBin')
    }
}

$filePath = "C:\Users\Rayman\Downloads"
$dataDate = "20180916"

$scaleVariableArray = 
"Precipitable_water_entire_atmosphere_single_layer",
"Pressure_surface",
"Temperature_surface",
"Wind_speed_gust_surface"

for ($i = 0; $i -lt $scaleVariableArray.Length; $i++) {
    $variableName = $scaleVariableArray[$i]
    $outputFile = "$filePath\${variableName}_$dataDate.tif"
    & "gdal_translate.exe" -of "GTiff" -ot "Byte" NETCDF:"$filePath\scaled.nc":$variableName "$filePath\tempFile_$variableName.tif"
    & "gdalwarp.exe" -t_srs "WGS84" -wo SOURCE_EXTRA=1000 --config CENTER_LONG 0 "$filePath\tempFile_$variableName.tif" "$outputFile"
}
Remove-TempFile $filePath