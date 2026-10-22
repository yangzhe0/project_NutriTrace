$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$nodeExecutable = (Get-Command node -ErrorAction Stop).Source
$upstreamUrl = Read-Host 'API地址（回车使用 http://127.0.0.1:8045）'
if ([string]::IsNullOrWhiteSpace($upstreamUrl)) { $upstreamUrl = 'http://127.0.0.1:8045' }
$secureApiKey = Read-Host 'API密钥（隐藏输入，留空使用离线示例）' -AsSecureString
$plainApiKey = [System.Net.NetworkCredential]::new('', $secureApiKey).Password
$startupJson = @{ base = $upstreamUrl; key = $plainApiKey; model = 'gemini-3.8-flash-high' } | ConvertTo-Json -Compress
Write-Host '打开 http://127.0.0.1:8765 。按 Ctrl+C 停止，密钥不写入文件。'
$startupJson | & $nodeExecutable (Join-Path $taskRoot 'server.cjs')
$plainApiKey = $null
$startupJson = $null
