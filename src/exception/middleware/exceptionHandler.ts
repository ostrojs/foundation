/**
 * Class ExceptionHandler.
 */
class ExceptionHandler {
    public declare $app: any;
    public $exceptionHandler: any;

    /**
     * Create a new instance.
     */
    constructor() {
        this.$exceptionHandler = this.$app.make('@ostro/contracts/exception/handler');
    }

    /**
     * handle method.
     * @param error - Error instance
     * @param context - Request and response context
     * @param next - Next middleware callback
     */
    public handle(error: any, { request, response }: Record<string, any>, next?: Function): void {
        this.$exceptionHandler.handler(((request.ajax() || request.wantJson()) ? 'json' : 'whoops')).handle(
            request,
            response,
            error
        );
    }

    /**
     * terminate method.
     * @param error - Error instance
     * @param context - Request and response context
     * @param next - Next middleware callback
     */
    public terminate(error: any, { request, response }: Record<string, any>, next?: Function): void {
        this.$exceptionHandler.handler('json').terminate(
            request,
            response,
            error
        );
    }
}

export default ExceptionHandler;
