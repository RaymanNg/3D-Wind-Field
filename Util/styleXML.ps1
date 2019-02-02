$colorArray1 = "#00007B", "#2964FF", "#5EB3FF", "#89DCFF", "#A9F3FF", "#E1FDB8",
"#FFE803", "#FF9E00", "#FF3000", "#DA0000", "#870000"

$start = -0.001044628
$end = 0.0006542896
$divide = 10

$interval = ($end - $start) / $divide
$quantity = $start
$quantityArray = @()
for ($i = 0; $i -le $divide; $i++) {
    $quantityArray += $quantity
    $quantity = $quantity + $interval
}

$xmlsettings = New-Object System.Xml.XmlWriterSettings
$xmlsettings.Indent = $true
$xmlsettings.IndentChars = "  "
$XmlWriter = [System.XML.XmlWriter]::Create("style.xml", $xmlsettings)

$xmlWriter.WriteStartElement("ColorMap")
for ($i = 0; $i -lt $colorArray1.Length; $i++) {
    $xmlWriter.WriteStartElement("ColorMapEntry")
    $xmlWriter.WriteAttributeString("color", $colorArray1[$i])
    $xmlWriter.WriteAttributeString("quantity", $quantityArray[$i])
    $xmlWriter.WriteEndElement() 
}
$xmlWriter.WriteEndElement() 

$xmlWriter.Flush()
$xmlWriter.Close()
