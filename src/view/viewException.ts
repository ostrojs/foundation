import ViewExceptionContract from '@ostro/contracts/view/viewException';

/**
 * Class ViewException.
 */
class ViewException extends ViewExceptionContract {
    public statusCode: number;

    /**
     * Create a new instance.
     * @param errors - Error object or message
     */
    constructor(errors: any) {
        super(errors);
        this.name = this.constructor.name;
        this.message = errors.message || errors;
        this.statusCode = 500;
        this.stack = errors.stack || (new Error()).stack;
    }
}

export default ViewException;