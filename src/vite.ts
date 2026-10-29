declare var public_path: any;
import fs from 'node:fs';
import { isset } from '@ostro/support/function';
import { startsWith } from '@ostro/support/string';

class ViteException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ViteException';
    }
}

/**
 * Class Vite.
 */
class Vite {
    public $manifests: Record<string, any> = {};
    public $app: any;

    /**
     * Create a new instance.
     * @param app - Application instance
     */
    constructor(app: any) {
        this.$app = app;
    }

    /**
     * Check if hot reload file exists.
     * @param $buildDirectory - Build directory inside public
     */
    /**
     * Check if hot reload file exists.
     * @param $buildDirectory - Build directory inside public
     */
    public isHot($buildDirectory: string = ''): boolean {
        const hotFile = $buildDirectory
            ? public_path(`${$buildDirectory}/hot`.replace(/\/+/g, '/'))
            : public_path('hot');
        if (fs.existsSync(hotFile)) {
            return true;
        }
        return fs.existsSync(public_path('hot'));
    }

    /**
     * Get hot file URL.
     */
    public hotUrl($buildDirectory: string = ''): string {
        const hotFile = $buildDirectory
            ? public_path(`${$buildDirectory}/hot`.replace(/\/+/g, '/'))
            : public_path('hot');
        if (fs.existsSync(hotFile)) {
            return fs.readFileSync(hotFile, 'utf8').trim();
        }
        const fallbackHot = public_path('hot');
        if (fs.existsSync(fallbackHot)) {
            return fs.readFileSync(fallbackHot, 'utf8').trim();
        }
        return '';
    }

    /**
     * Resolve asset path from manifest or dev server.
     * @param $entry - Entry file path (e.g. 'resources/assets/js/app.ts')
     * @param $buildDirectory - Build directory inside public
     */
    public asset($entry: string, $buildDirectory: string = ''): string {
        if (this.isHot($buildDirectory)) {
            const url = this.hotUrl($buildDirectory);
            const cleanEntry = $entry.replace(/^\/+/, '');
            return `${url}/${cleanEntry}`;
        }

        const manifest = this.getManifest($buildDirectory);
        const resolvedDir = (manifest as any).__buildDirectory ?? $buildDirectory;
        const cleanEntry = $entry.replace(/^\/+/, '');
        
        if (isset(manifest[cleanEntry])) {
            const chunk = manifest[cleanEntry];
            const file = typeof chunk === 'string' ? chunk : chunk.file;
            const assetUrl = this.$app['config']?.get('app.asset_url') || '';
            const buildPath = resolvedDir
                ? `/${resolvedDir}/${file}`.replace(/\/+/g, '/')
                : `/${file}`.replace(/\/+/g, '/');
            return `${assetUrl}${buildPath}`;
        }

        // Check by basename if direct entry not matched
        for (const [key, val] of Object.entries(manifest)) {
            if (key.startsWith('__')) continue;
            if (key.endsWith(cleanEntry) || cleanEntry.endsWith(key)) {
                const file = typeof val === 'string' ? val : (val as any).file;
                const assetUrl = this.$app['config']?.get('app.asset_url') || '';
                const buildPath = resolvedDir
                    ? `/${resolvedDir}/${file}`.replace(/\/+/g, '/')
                    : `/${file}`.replace(/\/+/g, '/');
                return `${assetUrl}${buildPath}`;
            }
        }

        const exception = new ViteException(`Unable to locate Vite file: ${$entry}.`);
        if (!this.$app?.instance?.('config')?.get('app.debug') && !this.$app?.config?.get('app.debug')) {
            if (this.$app?.['logger']?.report) {
                this.$app['logger'].report(exception);
            }
            return $entry;
        }
        throw exception;
    }

    /**
     * Generate HTML tags for entries (dev server or production build).
     * @param $entries - Entry file paths
     * @param $buildDirectory - Build directory inside public
     */
    public tags($entries: string | string[], $buildDirectory: string = ''): string {
        const entries = Array.isArray($entries) ? $entries : [$entries];
        const html: string[] = [];

        if (this.isHot($buildDirectory)) {
            const hotUrl = this.hotUrl($buildDirectory);
            html.push(`<script type="module" src="${hotUrl}/@vite/client"></script>`);
            for (const entry of entries) {
                const cleanEntry = entry.replace(/^\/+/, '');
                html.push(`<script type="module" src="${hotUrl}/${cleanEntry}"></script>`);
            }
            return html.join('\n');
        }

        const manifest = this.getManifest($buildDirectory);
        const resolvedDir = (manifest as any).__buildDirectory ?? $buildDirectory;
        const assetUrl = this.$app['config']?.get('app.asset_url') || '';

        for (const entry of entries) {
            const cleanEntry = entry.replace(/^\/+/, '');
            let chunk = manifest[cleanEntry];
            if (!chunk) {
                for (const [key, val] of Object.entries(manifest)) {
                    if (key.startsWith('__')) continue;
                    if (key.endsWith(cleanEntry) || cleanEntry.endsWith(key)) {
                        chunk = val;
                        break;
                    }
                }
            }

            if (chunk) {
                const file = typeof chunk === 'string' ? chunk : chunk.file;
                const href = resolvedDir
                    ? `${assetUrl}/${resolvedDir}/${file}`.replace(/\/+/g, '/')
                    : `${assetUrl}/${file}`.replace(/\/+/g, '/');
                if (file.endsWith('.css')) {
                    html.push(`<link rel="stylesheet" href="${href}">`);
                } else {
                    html.push(`<script type="module" src="${href}"></script>`);
                }

                // If JS imports CSS chunks
                if (chunk.css && Array.isArray(chunk.css)) {
                    for (const cssFile of chunk.css) {
                        const cssHref = resolvedDir
                            ? `${assetUrl}/${resolvedDir}/${cssFile}`.replace(/\/+/g, '/')
                            : `${assetUrl}/${cssFile}`.replace(/\/+/g, '/');
                        html.push(`<link rel="stylesheet" href="${cssHref}">`);
                    }
                }
            } else {
                const exception = new ViteException(`Unable to locate Vite file: ${entry}.`);
                if (!this.$app?.instance?.('config')?.get('app.debug') && !this.$app?.config?.get('app.debug')) {
                    if (this.$app?.['logger']?.report) {
                        this.$app['logger'].report(exception);
                    }
                } else {
                    throw exception;
                }
            }
        }

        return html.join('\n');
    }

    /**
     * Get parsed manifest.
     * @param $buildDirectory - Build directory inside public
     */
    public getManifest($buildDirectory: string = ''): Record<string, any> {
        let manifestPath = $buildDirectory
            ? public_path(`${$buildDirectory}/manifest.json`.replace(/\/+/g, '/'))
            : public_path('manifest.json');

        let resolvedBuildDir = $buildDirectory;
        if (!fs.existsSync(manifestPath)) {
            const fallbackPath = public_path('manifest.json');
            if (fs.existsSync(fallbackPath)) {
                manifestPath = fallbackPath;
                resolvedBuildDir = '';
            } else if (!$buildDirectory) {
                const buildSubdir = public_path('build/manifest.json');
                if (fs.existsSync(buildSubdir)) {
                    manifestPath = buildSubdir;
                    resolvedBuildDir = 'build';
                }
            }
        }

        if (!isset(this.$manifests[manifestPath])) {
            try {
                const stat = fs.lstatSync(manifestPath);
                if (!stat.isFile()) {
                    throw new ViteException('The Vite manifest does not exist.');
                }
                const parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                Object.defineProperty(parsed, '__buildDirectory', {
                    value: resolvedBuildDir,
                    enumerable: false,
                    writable: true
                });
                this.$manifests[manifestPath] = parsed;
            } catch (e: any) {
                if (e instanceof ViteException) throw e;
                throw new ViteException('The Vite manifest does not exist.');
            }
        }

        return this.$manifests[manifestPath];
    }
}

export default Vite;
export { ViteException };
