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
    public isHot($buildDirectory: string = 'build'): boolean {
        const hotFile = public_path('hot');
        return fs.existsSync(hotFile);
    }

    /**
     * Get hot file URL.
     */
    public hotUrl(): string {
        const hotFile = public_path('hot');
        if (fs.existsSync(hotFile)) {
            return fs.readFileSync(hotFile, 'utf8').trim();
        }
        return '';
    }

    /**
     * Resolve asset path from manifest or dev server.
     * @param $entry - Entry file path (e.g. 'resources/assets/js/app.ts')
     * @param $buildDirectory - Build directory inside public
     */
    public asset($entry: string, $buildDirectory: string = 'build'): string {
        if (this.isHot($buildDirectory)) {
            const url = this.hotUrl();
            const cleanEntry = $entry.replace(/^\/+/, '');
            return `${url}/${cleanEntry}`;
        }

        const manifest = this.getManifest($buildDirectory);
        const cleanEntry = $entry.replace(/^\/+/, '');
        
        if (isset(manifest[cleanEntry])) {
            const chunk = manifest[cleanEntry];
            const file = typeof chunk === 'string' ? chunk : chunk.file;
            const assetUrl = this.$app['config']?.get('app.asset_url') || '';
            const buildPath = `/${$buildDirectory}/${file}`.replace(/\/+/g, '/');
            return `${assetUrl}${buildPath}`;
        }

        // Check by basename if direct entry not matched
        for (const [key, val] of Object.entries(manifest)) {
            if (key.endsWith(cleanEntry) || cleanEntry.endsWith(key)) {
                const file = typeof val === 'string' ? val : (val as any).file;
                const assetUrl = this.$app['config']?.get('app.asset_url') || '';
                const buildPath = `/${$buildDirectory}/${file}`.replace(/\/+/g, '/');
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
    public tags($entries: string | string[], $buildDirectory: string = 'build'): string {
        const entries = Array.isArray($entries) ? $entries : [$entries];
        const html: string[] = [];

        if (this.isHot($buildDirectory)) {
            const hotUrl = this.hotUrl();
            html.push(`<script type="module" src="${hotUrl}/@vite/client"></script>`);
            for (const entry of entries) {
                const cleanEntry = entry.replace(/^\/+/, '');
                html.push(`<script type="module" src="${hotUrl}/${cleanEntry}"></script>`);
            }
            return html.join('\n');
        }

        const manifest = this.getManifest($buildDirectory);
        const assetUrl = this.$app['config']?.get('app.asset_url') || '';

        for (const entry of entries) {
            const cleanEntry = entry.replace(/^\/+/, '');
            let chunk = manifest[cleanEntry];
            if (!chunk) {
                for (const [key, val] of Object.entries(manifest)) {
                    if (key.endsWith(cleanEntry) || cleanEntry.endsWith(key)) {
                        chunk = val;
                        break;
                    }
                }
            }

            if (chunk) {
                const file = typeof chunk === 'string' ? chunk : chunk.file;
                const href = `${assetUrl}/${$buildDirectory}/${file}`.replace(/\/+/g, '/');
                if (file.endsWith('.css')) {
                    html.push(`<link rel="stylesheet" href="${href}">`);
                } else {
                    html.push(`<script type="module" src="${href}"></script>`);
                }

                // If JS imports CSS chunks
                if (chunk.css && Array.isArray(chunk.css)) {
                    for (const cssFile of chunk.css) {
                        const cssHref = `${assetUrl}/${$buildDirectory}/${cssFile}`.replace(/\/+/g, '/');
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
    public getManifest($buildDirectory: string = 'build'): Record<string, any> {
        const manifestPath = public_path(`${$buildDirectory}/manifest.json`.replace(/\/+/g, '/'));

        if (!isset(this.$manifests[manifestPath])) {
            try {
                const stat = fs.lstatSync(manifestPath);
                if (!stat.isFile()) {
                    throw new ViteException('The Vite manifest does not exist.');
                }
                this.$manifests[manifestPath] = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
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
