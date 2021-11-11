const HttpContext = require('@ostro/http/httpContext')
class FoundationHttpContext extends HttpContext {
    constructor(request, response, next) {
        super(request, response, next)
    }

    get auth() {
        return this.request.auth
    }

    get view() {
        return this.response.view
    }

    get session() {
        return this.request.session
    }

    get params() {
        return this.request.params
    }

    csrf_token() {
        return this.session.token() || ''
    }

    csrfToken() {
        return this.csrf_token()
    }

}

module.exports = FoundationHttpContext