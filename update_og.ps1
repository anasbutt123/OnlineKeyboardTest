$files = Get-ChildItem -Path . -Filter *.html -Recurse
foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    if ($content -match '<meta property="og:url"' -and $content -notmatch '<meta property="og:site_name"') {
        $newContent = $content -replace '<meta property="og:url"', "<meta property=`"og:site_name`" content=`"Online Keyboard Test`">`n  <meta property=`"og:url`""
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
        Write-Host "Updated $($file.FullName)"
    }
}
