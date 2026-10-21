import Ouch from 'ouch';

const kHandler: unique symbol = Symbol('handler');

/**
 * Class Json.
 */
class Json {
    private [kHandler]: any;

    /**
     * Create a new instance.
     */
    constructor() {
        this[kHandler] = this.register();
    }

    /**
     * register method.
     * @returns Ouch handler instance
     */
    public register(): any {
        return (new (Ouch as any)([new (Ouch as any).handlers.JsonResponseHandler(false, true, false)]));
    }

    /**
     * render method.
     * @param request - Request instance
     * @param response - Response instance
     * @param $exception - Exception object
     */
    public render(request: any, response: any, $exception: Record<string, any> = {}): void {
        this[kHandler].handleException($exception, null, null, function (exception: any) {
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