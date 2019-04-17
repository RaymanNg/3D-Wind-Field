$NCOPath = $Env:My_NetCDF_Operators_Path
$ncap2 = "$NCOPath\ncap2.exe"
$ncecat = "$NCOPath\ncecat.exe"
$ncks = "$NCOPath\ncks.exe"
$ncpdq = "$NCOPath\ncpdq.exe"
$ncrename = "$NCOPath\ncrename.exe"

Add-Type -AssemblyName Microsoft.VisualBasic
function Remove-TempNCFile($filePath) {
    Get-ChildItem -Path $filePath -Filter "temp*.nc" | ForEach-Object {
        $fileName = $_.name
        [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile("$filePath\$fileName ", 'OnlyErrorDialogs', 'SendToRecycleBin')
    }
}

$operation = "Extract"

switch ($operation) {
    "Split" {
        $filePath = "F:\ssh"
        $uWindFile = "$filePath\heb_AMIP70_Amon_U.nc"
        $vWindFile = "$filePath\heb_AMIP70_Amon_V.nc"
        
        $timeStepNum = 432

        for ($i = 0; $i -lt $timeStepNum; $i++) {
            # divide NetCDF file by time dimension
            & $ncks -d "time,$i" "$uWindFile" "$filePath\tempU.nc" 
            & $ncks -d "time,$i" "$vWindFile" "$filePath\tempV.nc"
            & $ncks -A "$filePath\tempU.nc" "$filePath\tempV.nc" # merge U and V into one file
            & $ncap2 -3 -S "getMinMax.nco" "$filePath\tempV.nc" "$filePath\uv_$i.nc"
            Remove-TempNCFile $filePath
        }
    }

    "Extract" {
        $filePath = "C:\Users\Rayman\Downloads"
        $dataDate = "20180916"
        $inputFile = "$filePath\$dataDate.nc"

        $scalarVariableArray = 
        "Precipitable_water_entire_atmosphere_single_layer",
        "Pressure_surface",
        "Temperature_surface",
        "Wind_speed_gust_surface"
        
        $scalarVariables = $scalarVariableArray -join ','
        & $ncks -v "$scalarVariables" "$inputFile" "$filePath\tempScalar.nc"
        & $ncap2 -3 -S "scale.nco" "$filePath\tempScalar.nc" "$filePath\scaled.nc"

        $uWind = "u-component_of_wind_planetary_boundary"
        $vWind = "v-component_of_wind_planetary_boundary"
        $windVariableArray = $uWind, $vWind
        
        $windVariable = $windVariableArray -join ','
        & $ncks -v "$windVariable" "$inputFile" "$filePath\tempWind.nc"
        & $ncrename -v "$uWind,U" -v "$vWind,V" "$filePath\tempWind.nc" "$filePath\tempUV.nc" 
        & $ncap2 -S "defineLev.nco" "$filePath\tempUV.nc" "$filePath\tempLevDim.nc" 
        & $ncecat -u "lev" "$filePath\tempLevDim.nc" "$filePath\tempRecDim.nc"
        & $ncks --no_rec_dmn "lev" "$filePath\tempRecDim.nc" "$filePath\tempFixDim.nc"
        & $ncpdq -a "-lat" "$filePath\tempFixDim.nc" "$filePath\tempInvDim.nc"
        & $ncap2 -3 -S "getMinMax.nco" "$filePath\tempInvDim.nc" "$filePath\uv.nc"
        Remove-TempNCFile $filePath
    }
}
