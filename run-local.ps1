param(
  [int]$Port = 4173
)

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

$existing = Get-CimInstance Win32_Process | Where-Object {
  $_.Name -match "^node" -and
  $_.CommandLine -match "server\.js" -and
  $_.CommandLine -match [regex]::Escape($projectRoot)
}

if ($existing) {
  $existing | ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force
  }
  Start-Sleep -Seconds 1
}

Start-Process -FilePath "node" `
  -ArgumentList "server.js" `
  -WorkingDirectory $projectRoot `
  -WindowStyle Minimized | Out-Null

Start-Sleep -Seconds 2

$url = "http://localhost:$Port"
Write-Output "Peter's Lab Blog Writer is available at $url"
