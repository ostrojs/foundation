const Ouch = require('ouch');
const kHandler = Symbol('handler')
class Json {
    constructor() {
        this[kHandler] = this.register()
    }
    register() {
        return (new Ouch([new Ouch.handlers.JsonResponseHandler(false, true, false)]))
    }
    render(request, response, $exception = {}) {
        this[kHandler].handleException($exception, null, null, function(exception) {
            let parsedObj = JSON.parse(exception).error || {}
            response.json({
                name: parsedObj.type,
                message: parsedObj.message,
                errors: ($exception.errors || {}),
                file: parsedObj.file,
                line: parsedObj.line,
                trace: parsedObj.trace,
            }, $exception.statusCode || 500)
        });
    }
}
module.exports = Json