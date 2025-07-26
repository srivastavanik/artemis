import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Files to fix
const filesToFix = [
  'src/services/brightdata.service.js',
  'src/services/llamaindex.service.js',
  'src/services/arcade.service.js',
  'src/services/supabase.service.js',
  'src/agents/scout.agent.js',
  'src/agents/analyst.agent.js',
  'src/agents/strategist.agent.js',
  'src/agents/executor.agent.js',
  'src/workflows/enrichment.workflow.js',
  'src/workflows/scoring.workflow.js',
  'src/workflows/orchestration.workflow.js',
  'src/routes/prospects.routes.js',
  'src/routes/campaigns.routes.js',
  'src/routes/analytics.routes.js',
];

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace named import with default import
    content = content.replace(
      /import\s+{\s*config\s*}\s+from\s+['"].*?config.*?['"];?/g,
      (match) => {
        if (match.includes('../../config')) {
          return "import config from '../../config/index.js';";
        } else if (match.includes('../config')) {
          return "import config from '../config/index.js';";
        }
        return match;
      }
    );
    
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Fixed: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
});

console.log('\n✨ Import fix complete!');
