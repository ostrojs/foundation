import path from 'node:path';

/**
 * Class AliasLoader.
 */
class AliasLoader {
    public _aliases: Record<string, any> | any[];

    /**
     * Create a new instance.
     * @param aliases - Map or list of aliases
     */
    constructor(aliases: Record<string, any> | any[] = []) {
        this._aliases = aliases;
    }

    /**
     * registerGlobal method.
     */
    public registerGlobal(): void {
        const aliases = this._aliases as Record<string, any>;
        for (const aliasKey in aliases) {
            let target = aliases[aliasKey];
            if (typeof target === 'string') {
                let targetPath = target;
                if (targetPath.startsWith('~/')) {
                    targetPath = path.resolve(process.cwd(), targetPath.slice(2));
                } else if (targetPath.startsWith('./')) {
                    targetPath = path.resolve(targetPath);
                }
                if (path.resolve(targetPath) === path.resolve(__filename)) {
                    target = AliasLoader;
                } else {
                    const mod = require(targetPath);
                    target = (mod && mod.__esModule && mod.default) ? mod.default : mod;
                }
            }
            (global as typeof globalThis)[aliasKey] = target;
        }
    }
}

export default AliasLoader;