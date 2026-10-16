$ErrorActionPreference = 'Stop'
$project = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$path = Join-Path $project 'app\workspace.tsx'
if (-not (Test-Path $path)) { throw "Khong tim thay $path" }
$text = [System.IO.File]::ReadAllText($path)
$marker = "useEffect(()=>{const params=new URLSearchParams(window.location.search);if(params.get('view')==='shared-tasks')setPage('shared-tasks');},[]);"
if ($text.Contains($marker)) { Write-Host 'Da them dieu huong tu truoc.'; exit 0 }
$anchor = "function go(p:string){setPage(p);"
if (-not $text.Contains($anchor)) { throw 'Khong tim thay diem chen an toan trong workspace.tsx. Khong sua file.' }
$backup = "$path.backup-before-v05-gd5a"
Copy-Item $path $backup -ErrorAction Stop
$text = $text.Replace($anchor, $marker + "`r`n" + $anchor)
[System.IO.File]::WriteAllText($path,$text,[System.Text.UTF8Encoding]::new($false))
Write-Host "Da them dieu huong. Backup: $backup"
