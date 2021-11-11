const fs = require('fs')
const MixExceptions = require('@ostro/support/exceptions/mixException')
const kManifest = Symbol('manifest')

class Mix {

    $manifests =  {};

    constructor(app) {
        this.$app = app

    }
    
    path($path, $manifestDirectory = '') {

        if (!String.startsWith($path, '/')) {
            $path = `/${$path}`;
        }

        if ($manifestDirectory && !String.startsWith($manifestDirectory, '/')) {
            $manifestDirectory = `/${$manifestDirectory}`;
        }

        let $manifestPath = public_path($manifestDirectory + '/mix-manifest.json');

        if (!isset(this.$manifests[$manifestPath])) {
            try {
                let stat = fs.lstatSync($manifestPath)
                if (!stat.isFile()) {
                    throw new MixExceptions('The Mix manifest does not exist.');
                }

                this.$manifests[$manifestPath] = JSON.parse(fs.readFileSync($manifestPath), true);
            } catch (e) {
                throw new MixExceptions('The Mix manifest does not exist.');
            }
        }

        let $manifest = this.$manifests[$manifestPath];
        if (!isset($manifest[$path])) {
            let $exception = new MixExceptions(`Unable to locate Mix file: ${$path}.`);
            if (!this.$app.instance('config').get('app.debug')) {
                this.$app['logger'].report($exception);
                return $path;
            } else {
                throw $exception;
            }
        }
        let mixurl = this.$app['config'].get('app.mix_url')
        mixurl = mixurl || ''
        return mixurl + $manifestDirectory + $manifest[$path]

    }

}

module.exports = Mix