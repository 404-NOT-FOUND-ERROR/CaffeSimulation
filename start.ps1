$taskNode = Get-Command node -ErrorAction SilentlyContinue
if ($taskNode) { $taskNodePath = $taskNode.Source }
else { $taskNodePath = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' }
if (!(Test-Path -LiteralPath $taskNodePath)) { throw '需要 Node.js 运行本地原型。' }
& $taskNodePath (Join-Path $PSScriptRoot 'serve.cjs')
