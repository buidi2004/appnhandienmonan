$screens = Get-ChildItem -Path d:\appnauan\mobile\src\screens\*.tsx
foreach ($file in $screens) {
    $content = Get-Content $file.FullName
    $newContent = $content -replace "designBorders", "borderPresets"
    if ($newContent -ne $content) {
        Set-Content $file.FullName $newContent
    }
}
