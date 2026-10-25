import Ouch from 'ouch';

/**
 * Class Whoops.
 */
class Whoops {
    #handler: any;

    /**
     * Create a new instance.
     */
    constructor() {
        this.#handler = this.register();
    }

    /**
     * register method.
     * @returns Ouch instance
     */
    public register(): any {
        const OuchConstructor = Ouch as {
            new (): { pushHandler: (handler: unknown) => unknown };
            handlers: { PrettyPageHandler: new (theme: string) => unknown };
        };
        return (new OuchConstructor()).pushHandler(new OuchConstructor.handlers.PrettyPageHandler('orange'));
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
        this.#handler.handleException($exception, request, response);
    }
}

export default Whoops;
