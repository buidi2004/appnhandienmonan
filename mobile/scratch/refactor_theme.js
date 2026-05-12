const fs = require('fs');
const path = require('path');

const screensDir = './src/screens';

function replaceInDir(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // Replace Theme import
      const themeRegex = /import\s+\{\s*colors\s+as\s+themeColors(.*?)\}\s+from\s+['"]\.\.\/theme\/colors['"];?/g;
      if (themeRegex.test(content)) {
        content = content.replace(themeRegex, "import { themeColors$1} from '../theme/index';");
        changed = true;
      }

      // Replace GlassCard default import
      const glassDefaultRegex = /import\s+GlassCard\s+from\s+['"]\.\.\/components\/GlassCard['"];?/g;
      if (glassDefaultRegex.test(content)) {
        content = content.replace(glassDefaultRegex, "import { GlassCard } from '../components/ui/GlassCard';");
        changed = true;
      }

      // Replace GlassCard named import
      const glassNamedRegex = /import\s+\{\s*GlassCard\s*\}\s+from\s+['"]\.\.\/components\/GlassCard['"];?/g;
      if (glassNamedRegex.test(content)) {
        content = content.replace(glassNamedRegex, "import { GlassCard } from '../components/ui/GlassCard';");
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

replaceInDir(screensDir);

// Update App.tsx
const appPath = './App.tsx';
if (fs.existsSync(appPath)) {
  let appContent = fs.readFileSync(appPath, 'utf8');
  const appThemeRegex = /import\s+\{\s*colors\s+as\s+themeColors(.*?)\}\s+from\s+['"]\.\/src\/theme\/colors['"];?/g;
  if (appThemeRegex.test(appContent)) {
    appContent = appContent.replace(appThemeRegex, "import { themeColors$1} from './src/theme/index';");
    fs.writeFileSync(appPath, appContent);
    console.log(`Updated: ${appPath}`);
  }
}

console.log('Refactoring completed.');
