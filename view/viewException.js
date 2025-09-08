const ViewExceptionContract = require('@ostro/contracts/view/viewException')
class ViewException extends ViewExceptionContract {
    constructor(errors) {
        super(errors);
        this.name = this.constructor.name;
        this.message = errors.message || errors;
        this.statusCode = 500;
        this.stack = errors.stack || (new Error()).stack;
    }
}
module.exports = ViewException