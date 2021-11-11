const ViewExceptionContract = require('@ostro/contracts/view/viewException')
class ViewException extends ViewExceptionContract {
    constructor(errors) {
        super();
        this.name = this.constructor.name;
        this.message = errors;
        this.statusCode = 500;
        Error.captureStackTrace(this, this.constructor);

    }
}
module.exports = ViewException