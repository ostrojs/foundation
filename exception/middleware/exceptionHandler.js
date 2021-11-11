class ExceptionHandler {
    constructor() {
        this.$exceptionHandler = this.$app.make('@ostro/contracts/exception/handler')
    }
    handle(error, { request, response },next) {
        this.$exceptionHandler.handler(((request.ajax() || request.wantJson()) ? 'json' : 'whoops')).handle(
            request,
            response,
            error
        )
    }
}

module.exports = ExceptionHandler