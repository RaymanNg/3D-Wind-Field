$timeStepNum = 432

$filePath = 'F:\ssh'
$inputFile1 = "$filePath\heb_AMIP70_Amon_U.nc"
$inputFile2 = "$filePath\heb_AMIP70_Amon_V.nc"

$exeFile = "ncks.exe"

for ($i = 0; $i -lt $timeStepNum; $i++) {
    & $exeFile -3 -d "time,$i" "$inputFile1" "$filePath\u_$i.nc"
    & $exeFile -3 -d "time,$i" "$inputFile2" "$filePath\uv_$i.nc"
    & $exeFile -3 -A "$filePath\u_$i.nc" "$filePath\uv_$i.nc"
}