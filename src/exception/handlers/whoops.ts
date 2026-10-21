import Ouch from 'ouch';

const kHandler: unique symbol = Symbol('handler');

/**
 * Class Whoops.
 */
class Whoops {
    private [kHandler]: any;

    /**
     * Create a new instance.
     */
    constructor() {
        this[kHandler] = this.register();
    }

    /**
     * register method.
     * @returns Ouch instance
     */
    public register(): any {
        return (new (Ouch as any)()).pushHandler(new (Ouch as any).handlers.PrettyPageHandler('orange'));
    }

    /**
     * render method.
     * @param request - Request instance
     * @param response - Response instance
     * @param $exception - Exception object
     */
    public render(request: any, response: any, $exception: Record<string, any> = {}): void {
        if (!response.headersSent) {
            response.writeHead(($exception.statusCode || 500), { 'Content-Type': 'text/html' });
        }
        this[kHandler].handleException($exception, request, response);
    }
}

export default Whoops;
