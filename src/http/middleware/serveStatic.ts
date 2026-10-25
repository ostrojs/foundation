import serveStatic from 'serve-static';

// Framework global: $app
declare const $app: any;

/**
 * Class ServeStatic.
 */
class ServeStatic {
    public $publicPath: string;

    /**
     * Create a new instance.
     */
    constructor() {
        this.$publicPath = $app['path.public'];
    }

    public get $defaultOptions(): Record<string, any> {
        return {
            'maxAge': '180d'
        };
    }

    public get $options(): Record<string, any> {
        return {};
    }

    /**
     * handle method.
     * @param context - Request and response context
     * @param next - Next middleware callback
     */
    public handle({ request, response }: Record<string, any>, next: Function): void {
        serveStatic(this.$publicPath, { ...this.$defaultOptions, ...this.$options })(request, response, next as (err?: unknown) => void);
    }
}

export default ServeStatic;