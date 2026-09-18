$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) { throw 'Node.js is required.' }
& $nodeCmd.Source "$PSScriptRoot\node_modules\vite\bin\vite.js" --host 127.0.0.1 --port 5173 --strictPort
