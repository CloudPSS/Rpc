param(
  [string]$version
)

$ErrorActionPreference = 'Stop'

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

$tempDir = (New-Item -Path "$PSScriptRoot/temp/$([guid]::NewGuid())" -ItemType Directory -Force).FullName
try {
  Invoke-WebRequest "https://dlcdn.apache.org/thrift/$lateset/thrift-$lateset.exe" -OutFile "$tempDir/thrift.exe"
  Invoke-WebRequest "https://dlcdn.apache.org/thrift/$lateset/thrift-$lateset.tar.gz" -OutFile "$tempDir/thrift.tar.gz"

  docker buildx build --platform linux/amd64 --build-context "thrift-source=$tempDir" `
    --output "type=local,dest=$tempDir" $PSScriptRoot
  if ($LASTEXITCODE -ne 0) {
    throw "Docker failed to build the Linux Thrift compiler (exit code $LASTEXITCODE)."
  }

  $packagePath = "$PSScriptRoot/../package.json"
  $pkg = Get-Content -LiteralPath $packagePath -Raw | ConvertFrom-Json
  $pkg.peerDependencies.thrift = "$lateset"

  Copy-Item -LiteralPath "$tempDir/thrift" -Destination "$PSScriptRoot/../bin/thrift" -Force
  Copy-Item -LiteralPath "$tempDir/thrift.exe" -Destination "$PSScriptRoot/../bin/thrift.exe" -Force
  ConvertTo-Json $pkg | Out-File -LiteralPath $packagePath
  Write-Output "Updated bin/thrift and bin/thrift.exe to $lateset"
} finally {
  Remove-Item -LiteralPath $tempDir -Force -Recurse
}
