interface IProviderManifest {
    providers: any[];
    eager: any[];
    deferred: any[];
}

/**
 * Class ProviderRepository.
 */
class ProviderRepository {
    public $app: any;
    public $files: any;

    /**
     * Create a new instance.
     * @param $app - Application instance
     * @param $files - Filesystem instance
     */
    constructor($app: any, $files: any) {
        this.$app = $app;
        this.$files = $files;
    }

    /**
     * load method.
     * @param $providers - List of service providers
     */
    public load($providers: any[]): void {
        const $manifest = this.compileManifest($providers);

        for (const $provider of $manifest['eager']) {
            this.$app.register($provider);
        }

        this.$app.addDeferredServices($manifest['deferred']);
    }

    /**
     * loadManifest method.
     */
    public loadManifest(): void {
    }

    /**
     * compileManifest method.
     * @param $providers - List of providers to compile
     * @returns Compiled manifest
     */
    public compileManifest($providers: any[]): IProviderManifest {
        const $manifest = this.freshManifest($providers);

        for (const $provider of $providers) {
            const $instance = this.createProvider($provider);

            if ($instance.isDeferred()) {
                $manifest['deferred'].push($provider);
            } else {
                $manifest['eager'].push($provider);
            }
        }

        return this.writeManifest($manifest);
    }

    /**
     * freshManifest method.
     * @param $providers - List of providers
     * @returns Fresh manifest structure
     */
    public freshManifest($providers: any[]): IProviderManifest {
        return {
            'providers': $providers,
            'eager': [],
            'deferred': []
        };
    }

    /**
     * writeManifest method.
     * @param $manifest - Manifest to write
     * @returns Manifest
     */
    public writeManifest($manifest: IProviderManifest): IProviderManifest {
        return $manifest;
    }

    /**
     * createProvider method.
     * @param $provider - Provider constructor
     * @returns Provider instance
     */
    public createProvider($provider: new ($app: any) => any): any {
        return new $provider(this.$app);
    }
}

export default ProviderRepository;