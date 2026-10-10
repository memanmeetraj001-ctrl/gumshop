import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const rootDir = process.cwd();

export async function resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
        let relative = specifier.slice(2);
        let resolvedPath = path.join(rootDir, relative);
        if (!path.extname(resolvedPath)) {
            if (fs.existsSync(resolvedPath + '.js')) resolvedPath += '.js';
            else if (fs.existsSync(resolvedPath + '.jsx')) resolvedPath += '.jsx';
        }
        return nextResolve(pathToFileURL(resolvedPath).href, context);
    }
    return nextResolve(specifier, context);
}
