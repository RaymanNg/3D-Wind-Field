$colorArray = 
"#040ED8",
"#2050FF",
"#4196FF",
"#6DC1FF",
"#86D9FF",
"#9CEEFF",
"#AFF5FF",
"#CEFFFF",
"#FFFE47",
"#FFEB00",
"#FFC400",
"#FF9000",
"#FF4800",
"#FF0000",
"#D50000",
"#9E0000"

$start = 0
$end = 255
$divide = $colorArray.Length

$interval = ($end - $start) / ($divide - 1)
$quantity = $start
$quantityArray = @()
for ($i = 0; $i -le $divide; $i++) {
    $quantityArray += $quantity
    $quantity = $quantity + $interval
}

$xmlsettings = New-Object System.Xml.XmlWriterSettings
$xmlsettings.Indent = $true
$xmlsettings.IndentChars = "  "
$XmlWriter = [System.XML.XmlWriter]::Create("./Util/style.xml", $xmlsettings)

$xmlWriter.WriteStartElement("ColorMap")
for ($i = 0; $i -lt $colorArray.Length; $i++) {
    $xmlWriter.WriteStartElement("ColorMapEntry")
    $xmlWriter.WriteAttributeString("color", $colorArray[$i])
    $xmlWriter.WriteAttributeString("quantity", $quantityArray[$i])
    $xmlWriter.WriteEndElement() 
}
$xmlWriter.WriteEndElement() 

$xmlWriter.Flush()
$xmlWriter.Close()
