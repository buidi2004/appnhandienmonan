$screens = Get-ChildItem -Path d:\appnauan\mobile\src\screens\*.tsx
foreach ($file in $screens) {
    $content = Get-Content $file.FullName
    
    # Nếu dòng import chứa nhiều thành phần từ '../theme/colors' mà bị lỗi
    if ($content -match "from '../theme/colors'") {
        # Tách nhỏ các import ra đúng file
        $newContent = $content -replace "import \{ (.*) \} from '../theme/colors';", "import { `$1 } from '../theme/index';"
        
        # Sau đó chạy lại script split chuẩn
        $newContent = $newContent -replace "import \{ themeColors, gradients, glass, glow, shadow, typography, borderWidth, borderRadius, borderColors, borderPresets \} from '../theme/index';", 
                                          "import { themeColors, gradients } from '../theme/colors';`nimport { glass } from '../theme/glass';`nimport { glow } from '../theme/glow';`nimport { shadow } from '../theme/shadow';`nimport { typography } from '../theme/typography';`nimport { borderWidth, borderRadius, borderColors, borderPresets } from '../theme/borders';"

        $newContent = $newContent -replace "import \{ themeColors, gradients, glass, glow, borderRadius, borderPresets \} from '../theme/index';", 
                                          "import { themeColors, gradients } from '../theme/colors';`nimport { glass } from '../theme/glass';`nimport { glow } from '../theme/glow';`nimport { borderWidth, borderRadius, borderColors, borderPresets } from '../theme/borders';"

        if ($newContent -ne $content) {
            Set-Content $file.FullName $newContent
        }
    }
}
