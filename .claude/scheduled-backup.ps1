# Runs every 10 minutes from Windows Task Scheduler (task name: RegionBygGitHubBackup).
# Saves everything in this project to GitHub, even when Claude is not running.
# Log: %USERPROFILE%\regionbyg-backup.log   Remove the task: Unregister-ScheduledTask -TaskName RegionBygGitHubBackup -Confirm:$false
$ErrorActionPreference = "Continue"
$proj = Split-Path -Parent $PSScriptRoot
$unix = "/" + $proj.Substring(0, 1).ToLower() + ($proj.Substring(2) -replace '\\', '/')
$env:SYNC_SOURCE = "scheduled-backup"
$log = Join-Path $env:USERPROFILE "regionbyg-backup.log"
$out = & "C:\Program Files\Git\bin\bash.exe" -lc "cd '$unix' && bash .claude/auto-sync.sh" 2>&1 | Out-String
$stamp = Get-Date -Format "yyyy-MM-dd HH:mm"
if ($out.Trim()) { Add-Content -Path $log -Value "[$stamp] $($out.Trim())" }
# keep the log small
if ((Test-Path $log) -and (Get-Item $log).Length -gt 200KB) { Get-Content $log -Tail 200 | Set-Content $log }
