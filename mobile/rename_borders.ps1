$screens = Get-ChildItem -Path d:\appnauan\mobile\src\screens\*.tsx
foreach ($file in $screens) {
    $content = Get-Content $file.FullName
    $newContent = $content -replace "borderPresets", "designBorders"
    if ($newContent -ne $content) {
        Set-Content $file.FullName $newContent
    }
}
