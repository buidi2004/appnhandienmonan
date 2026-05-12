$screens = Get-ChildItem -Path d:\appnauan\mobile\src\screens\*.tsx
foreach ($file in $screens) {
    $content = Get-Content $file.FullName
    
    # Chuyển đổi các import từ theme/index sang file lẻ tương ứng
    $newContent = $content -replace "import \{ themeColors, gradients, glass, glow, borderWidth, borderRadius, borderColors, borderPresets \} from '../theme/index';", 
                                  "import { themeColors, gradients } from '../theme/colors';`nimport { glass } from '../theme/glass';`nimport { glow } from '../theme/glow';`nimport { borderWidth, borderRadius, borderColors, borderPresets } from '../theme/borders';"
    
    # Xử lý các biến thể import khác nếu có
    $newContent = $newContent -replace "from '../theme/index'", "from '../theme/colors'"
    
    if ($newContent -ne $content) {
        Set-Content $file.FullName $newContent
    }
}
