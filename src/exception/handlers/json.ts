import Ouch from 'ouch';

/**
 * Class Json.
 */
class Json {
    #handler: any;

    /**
     * Create a new instance.
     */
    constructor() {
        this.#handler = this.register();
    }

    /**
     * register method.
     * @returns Ouch handler instance
     */
    public register(): any {
        const OuchConstructor = Ouch as {
            new (handlers: unknown[]): unknown;
            handlers: { JsonResponseHandler: new (trace: boolean, verbose: boolean, debug: boolean) => unknown };
        };
        return new OuchConstructor([new OuchConstructor.handlers.JsonResponseHandler(false, true, false)]);
    }

    /**
     * render method.
     * @param request - Request instance
     * @param response - Response instance
     * @param $exception - Exception object
     */
    public render(request: any, response: any, $exception: Record<string, any> = {}): void {
        this.#handler.handleException($exception, null, null, function (exception: any) {
            const parsedObj = JSON.parse(exception).error || {};
            response.json({
                name: parsedObj.type,
                message: parsedObj.message,
                errors: ($exception.errors || {}),
                file: parsedObj.file,
                line: parsedObj.line,
                trace: parsedObj.trace,
            }, $exception.statusCode || 500);
        });
    }
}

export default Json;