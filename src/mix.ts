declare var public_path: any;
import fs from 'fs';
import MixExceptions from '@ostro/support/exceptions/mixException';
import { isset } from '@ostro/support/function';
import { startsWith } from '@ostro/support/string';

// Framework global: public_path

const kManifest: unique symbol = Symbol('manifest');

/**
 * Class Mix.
 */
class Mix {
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
     * path method.
     * @param $path - Asset path
     * @param $manifestDirectory - Manifest directory
     * @returns Resolved asset path
     */
    public path($path: string, $manifestDirectory: string = ''): string {
        if (!startsWith($path, '/')) {
            $path = `/${$path}`;
        }

        if ($manifestDirectory && !startsWith($manifestDirectory, '/')) {
            $manifestDirectory = `/${$manifestDirectory}`;
        }

        const $manifestPath: string = public_path($manifestDirectory + '/mix-manifest.json');

        if (!isset(this.$manifests[$manifestPath])) {
            try {
                const stat = fs.lstatSync($manifestPath);
                if (!stat.isFile()) {
                    throw new MixExceptions('The Mix manifest does not exist.');
                }

                this.$manifests[$manifestPath] = JSON.parse(fs.readFileSync($manifestPath) as any);
            } catch (e) {
                throw new MixExceptions('The Mix manifest does not exist.');
            }
        }

        const $manifest = this.$manifests[$manifestPath];
        if (!isset($manifest[$path])) {
            const $exception = new MixExceptions(`Unable to locate Mix file: ${$path}.`);
            if (!this.$app.instance('config').get('app.debug')) {
                this.$app['logger'].report($exception);
                return $path;
            } else {
                throw $exception;
            }
        }
        let mixurl: string = this.$app['config'].get('app.mix_url');
        mixurl = mixurl || '';
        return mixurl + $manifestDirectory + $manifest[$path];
    }
}

export default Mix;