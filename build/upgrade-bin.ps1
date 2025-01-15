param(
  [string]$version
)

$index = Invoke-WebRequest "https://dlcdn.apache.org/thrift"
$versions = @(
  $index.Links 
  | Where-Object { $_.href.EndsWith("/") -and [char]::IsDigit($_.href[0]) }
  | ForEach-Object { $_.href.SubString(0, $_.href.Length - 1) }
  | Sort-Object { [System.Version]$_ }
)

if ($version) {
  $lateset = $versions | Where-Object { $_ -eq $version }
  if (-not $lateset) {
    Write-Output "Cannot find thrift version $version"
    exit 1
  }
} else {
  $lateset = $versions[-1]
  Write-Output "Latest versions of the thrift is $lateset"
}

Invoke-WebRequest "https://dlcdn.apache.org/thrift/$lateset/thrift-$lateset.exe" -OutFile "$PSScriptRoot/../bin/thrift.exe"
Write-Output "Downloaded thrift-$lateset.exe to bin/thrift.exe"

Remove-Item "$PSScriptRoot/temp" -Force -Recurse | Out-Null
New-Item "$PSScriptRoot/temp" -Type Directory | Out-Null
Invoke-WebRequest "https://dlcdn.apache.org/thrift/$lateset/thrift-$lateset.tar.gz" -OutFile "$PSScriptRoot/temp/thrift.tar.gz"
Write-Output "Downloaded thrift-$lateset.tar.gz to build/temp/thrift.tar.gz"

docker run --rm -v "$PSScriptRoot/:/app" --workdir "/app" buildpack-deps:18.04 ./build-thrift.sh

Copy-Item "$PSScriptRoot/temp/thrift" "$PSScriptRoot/../bin/thrift" -Force
Write-Output "Copy thrift to bin/thrift"
Remove-Item "$PSScriptRoot/temp" -Force -Recurse

$pkg = Get-Content "$PSScriptRoot/../package.json" | ConvertFrom-Json
$pkg.peerDependencies.thrift = "$lateset"
ConvertTo-Json $pkg | Out-File "$PSScriptRoot/../package.json"
