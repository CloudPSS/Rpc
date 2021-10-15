$index = Invoke-WebRequest "https://dlcdn.apache.org/thrift"
$versions = (
  $index.Links 
  | Where-Object { $_.href.EndsWith("/") -and [char]::IsDigit($_.href[0]) }
  | ForEach-Object { $_.href.SubString(0, $_.href.Length - 1) }
  | Sort-Object { [System.Version]$_ }
)
$lateset = $versions[-1]

Write-Output "Latest versions of the thrift is $lateset"
Invoke-WebRequest "https://dlcdn.apache.org/thrift/$lateset/thrift-$lateset.exe" -OutFile "$PSScriptRoot/bin/thrift.exe"
Write-Output "Downloaded thrift-$lateset.exe to bin/thrift.exe"
Invoke-WebRequest "https://dlcdn.apache.org/thrift/$lateset/thrift-$lateset.tar.gz" -OutFile "$PSScriptRoot/bin/thrift.tar.gz"
Write-Output "Downloaded thrift-$lateset.tar.gz to bin/thrift.tar.gz"

$pkg = Get-Content "$PSScriptRoot/package.json" | ConvertFrom-Json
$pkg.dependencies.thrift = "$lateset"
ConvertTo-Json $pkg | Out-File "$PSScriptRoot/package.json"
