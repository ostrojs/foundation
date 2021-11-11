class ProviderRepository {

    constructor($app, $files) {
        this.$app = $app;
        this.$files = $files;
    }

    load($providers) {

        let $manifest = this.compileManifest($providers);

        for (let $provider of $manifest['eager']) {
            this.$app.register($provider);
        }

        this.$app.addDeferredServices($manifest['deferred']);
    }

    loadManifest() {

    }

    compileManifest($providers) {

        let $manifest = this.freshManifest($providers);

        for (let $provider of $providers) {

            let $instance = this.createProvider($provider);

            if ($instance.isDeferred()) {
                $manifest['deferred'].push($provider)
            } else {
                $manifest['eager'].push($provider);
            }
        }

        return this.writeManifest($manifest);
    }

    freshManifest($providers) {
        return {
            'providers': $providers,
            'eager': [],
            'deferred': []
        };
    }

    writeManifest($manifest) {

        return $manifest
    }

    createProvider($provider) {
        return new $provider(this.$app);
    }
}

module.exports = ProviderRepository