$screens = Get-ChildItem -Path d:\appnauan\mobile\src\screens\*.tsx
foreach ($file in $screens) {
    $content = Get-Content $file.FullName
    $changed = $false
    
    # Xử lý line-by-line để đảm bảo chính xác tuyệt đối
    $newLines = foreach ($line in $content) {
        if ($line -match "from '../theme/index'") {
            $changed = $true
            if ($line -match "themeColors|gradients") {
                $line = $line -replace "from '../theme/index'", "from '../theme/colors'"
            }
            if ($line -match "glass") {
                $line = $line -replace "from '../theme/index'", "from '../theme/glass'"
            }
            if ($line -match "glow") {
                $line = $line -replace "from '../theme/index'", "from '../theme/glow'"
            }
            if ($line -match "shadow") {
                $line = $line -replace "from '../theme/index'", "from '../theme/shadow'"
            }
            if ($line -match "typography") {
                $line = $line -replace "from '../theme/index'", "from '../theme/typography'"
            }
            if ($line -match "borderWidth|borderRadius|borderColors|borderPresets") {
                $line = $line -replace "from '../theme/index'", "from '../theme/borders'"
            }
        }
        $line
    }
    
    if ($changed) {
        Set-Content $file.FullName $newLines
    }
}
