const Ouch = require('ouch');
const kHandler = Symbol('handler')
class Whoops {
    constructor() {
        this[kHandler] = this.register()
    }
    register() {
        return (new Ouch).pushHandler(new Ouch.handlers.PrettyPageHandler('orange'))
    }
    render(request, response, $exception = {}) {
        if (!response.headersSent) {
            response.writeHead(($exception.statusCode || 500), 'Content-Type: text/html');
        }
        this[kHandler].handleException($exception, request, response)
    }
}
module.exports = Whoops