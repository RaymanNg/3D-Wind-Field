$timeStepNum = 432

$filePath = 'F:\ssh'
$inputFile1 = "$filePath\heb_AMIP70_Amon_U.nc"
$inputFile2 = "$filePath\heb_AMIP70_Amon_V.nc"

$ncks = "ncks.exe"
$ncap2 = "ncap2.exe"

for ($i = 0; $i -lt $timeStepNum; $i++) {
    & $ncks -3 -d "time,$i" "$inputFile1" "$filePath\u_$i.nc" # divide NetCDF file by time dimension
    & $ncks -3 -d "time,$i" "$inputFile2" "$filePath\uv_$i.nc"
    & $ncks -3 -A "$filePath\u_$i.nc" "$filePath\uv_$i.nc" # combine U and V into one file
    & $ncap2 -3 -S "process.nco" "$filePath\uv_$i.nc" "$filePath\data_$i.nc"
}