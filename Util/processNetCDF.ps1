# Set the install path of NetCDF Operators
$NCOPath = "path\to\NetCDFOperators"
$ncap2 = "$NCOPath\ncap2.exe"
$ncecat = "$NCOPath\ncecat.exe"
$ncks = "$NCOPath\ncks.exe"
$ncpdq = "$NCOPath\ncpdq.exe"
$ncrename = "$NCOPath\ncrename.exe"

# Set the absolute path of the NetCDF file you want to process
$fileToProcess = "path\to\file.nc"

Add-Type -AssemblyName Microsoft.VisualBasic
function Remove-TempNCFile($fileDirectory) {
    Get-ChildItem -Path $fileDirectory -Filter "temp*.nc" | ForEach-Object {
        $fileName = $_.name
        [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile("$fileDirectory\$fileName", 'OnlyErrorDialogs', 'SendToRecycleBin')
    }
}

function Main {
    $fileDirectory = Split-Path $fileToProcess -Parent

    $scalarVariableArray = 
    "Precipitable_water_entire_atmosphere_single_layer",
    "Pressure_surface",
    "Temperature_surface",
    "Wind_speed_gust_surface"

    $scalarVariables = $scalarVariableArray -join ','
    & $ncks -v "$scalarVariables" "$fileToProcess" "$fileDirectory\tempScalar.nc"
    & $ncap2 -3 -S "scale.nco" "$fileDirectory\tempScalar.nc" "$fileDirectory\scaled.nc"

    $uWind = "u-component_of_wind_planetary_boundary"
    $vWind = "v-component_of_wind_planetary_boundary"
    $windVariableArray = $uWind, $vWind

    $windVariable = $windVariableArray -join ','
    & $ncks -v "$windVariable" "$fileToProcess" "$fileDirectory\tempWind.nc"
    & $ncrename -v "$uWind,U" -v "$vWind,V" "$fileDirectory\tempWind.nc" "$fileDirectory\tempUV.nc" 
    & $ncap2 -S "defineLev.nco" "$fileDirectory\tempUV.nc" "$fileDirectory\tempLevDim.nc" 
    & $ncecat -u "lev" "$fileDirectory\tempLevDim.nc" "$fileDirectory\tempRecDim.nc"
    & $ncks --no_rec_dmn "lev" "$fileDirectory\tempRecDim.nc" "$fileDirectory\tempFixDim.nc"
    & $ncpdq -a "-lat" "$fileDirectory\tempFixDim.nc" "$fileDirectory\tempInvDim.nc"
    & $ncap2 -3 -S "getMinMax.nco" "$fileDirectory\tempInvDim.nc" "$fileDirectory\uv.nc"
    Remove-TempNCFile $fileDirectory
}

Main
