# Simple static file server for local development (no build step needed).
# Usage: powershell -ExecutionPolicy Bypass -File .\serve-local.ps1 -Port 5500
param(
    [int]$Port = 5500
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$types = @{
    '.html' = 'text/html; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.mjs'  = 'application/javascript; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.txt'  = 'text/plain; charset=utf-8'
    '.md'   = 'text/plain; charset=utf-8'
    '.sql'  = 'text/plain; charset=utf-8'
    '.svg'  = 'image/svg+xml'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.gif'  = 'image/gif'
    '.webp' = 'image/webp'
    '.ico'  = 'image/x-icon'
    '.woff' = 'font/woff'
    '.woff2'= 'font/woff2'
    '.mp3'  = 'audio/mpeg'
    '.mp4'  = 'video/mp4'
}

if (-not [System.Net.HttpListener]::IsSupported) { throw 'HttpListener not supported.' }

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root at http://localhost:$Port/  (Ctrl+C to stop)"

while ($listener.IsListening) {
    try { $ctx = $listener.GetContext() } catch { break }
    $req = $ctx.Request
    $res = $ctx.Response
    # LocalPath is percent-decoded; AbsolutePath would keep %20 in folder names.
    $url = $req.Url.LocalPath
    if ($url -eq '/' -or $url -eq '') { $url = '/index.html' }
    $rel = $url.TrimStart('/').Replace('/', [IO.Path]::DirectorySeparatorChar)
    $path = Join-Path $root $rel

    if ((Test-Path -LiteralPath $path -PathType Container) -and
        (Test-Path -LiteralPath (Join-Path $path 'index.html'))) {
        $path = Join-Path $path 'index.html'
    }

    # Never serve the supabase/ directory: schema.sql and teacher-bootstrap.sql
    # are not web assets, and teacher-bootstrap.sql contains a setup credential.
    $blocked = @('supabase')
    $segments = $rel.Split([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar) |
        Where-Object { $_ -and $_ -ne '..' }
    if ($segments | Where-Object { $blocked -contains $_.ToLowerInvariant() }) {
        $res.StatusCode = 403
        $b = [Text.Encoding]::UTF8.GetBytes("403 Forbidden")
        $res.ContentType = 'text/plain'
        $res.ContentLength64 = $b.Length
        $res.OutputStream.Write($b, 0, $b.Length)
        $res.Close()
        continue
    }

    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        $res.StatusCode = 404
        $b = [Text.Encoding]::UTF8.GetBytes("404 Not Found: $rel")
        $res.ContentType = 'text/plain'
        $res.ContentLength64 = $b.Length
        $res.OutputStream.Write($b, 0, $b.Length)
        $res.Close()
        continue
    }

    $ext = [IO.Path]::GetExtension($path).ToLowerInvariant()
    try {
        $bytes = [IO.File]::ReadAllBytes($path)
        $res.StatusCode = 200
        $res.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' }
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } catch {
        $res.StatusCode = 500
    } finally {
        $res.Close()
    }
}

$listener.Stop()
