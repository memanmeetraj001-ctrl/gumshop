import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const issues = [];

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        if (f === 'node_modules' || f === '.next' || f === '.git') continue;
        const full = path.join(dir, f);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
            walk(full);
        } else if (f.endsWith('.js') || f.endsWith('.jsx')) {
            checkFile(full);
        }
    }
}

function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relPath = path.relative(rootDir, filePath).replace(/\\/g, '/');

    // 1. Check imports
    const importRegex = /(?:import\s+(?:[\w*\s{},]*)\s+from\s+['"]([^'"]+)['"]|import\(['"]([^'"]+)['"]\))/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        const imp = match[1] || match[2];
        if (imp.startsWith('@/') || imp.startsWith('./') || imp.startsWith('../')) {
            let targetPath;
            if (imp.startsWith('@/')) {
                targetPath = path.join(rootDir, imp.replace(/^@\//, ''));
            } else {
                targetPath = path.resolve(path.dirname(filePath), imp);
            }

            // Check if file or file.js/jsx or /index.js exists
            const extensions = ['', '.js', '.jsx', '.json', '/index.js', '/index.jsx'];
            const exists = extensions.some(ext => fs.existsSync(targetPath + ext));
            if (!exists) {
                issues.push({
                    file: relPath,
                    type: 'BROKEN_IMPORT',
                    detail: `Import '${imp}' cannot be resolved`
                });
            }
        }
    }

    // 2. Check for unused / undefined common bugs
    if (content.includes('localStorage.') && !content.includes('typeof window') && !filePath.includes('lib/')) {
        // Warning: Direct localStorage access without window check in SSR
        if (!content.includes('typeof window !== \'undefined\'')) {
            issues.push({
                file: relPath,
                type: 'SSR_STORAGE_LEAK',
                detail: `Direct localStorage access without window check`
            });
        }
    }
}

console.log('Auditing codebase imports and references...');
walk(rootDir);

if (issues.length === 0) {
    console.log('✅ ALL IMPORTS AND LOCAL MODULES RESOLVED PERFECTLY!');
} else {
    console.log(`Found ${issues.length} potential issues:`);
    issues.forEach(i => console.log(`[${i.type}] ${i.file}: ${i.detail}`));
}
