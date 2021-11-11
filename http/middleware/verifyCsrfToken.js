const tokens = require('csrf')()
const TokenMismatchException = require('@ostro/http/exception/tokenMismatchException')
class VerifyCsrfToken {
    
    $cookieName = 'XSRF-TOKEN';

    $addHttpCookie = true;

    $except = [
        //
    ];

    handle({ request, response }, next) {
        if (
            this.isReading(request) ||
            this.inExceptArray(request) ||
            this.tokensMatch(request)
        ) {
            if (this.shouldAddXsrfTokenCookie()) {
                this.addCookieToResponse(request, response);
            }
            next()
        } else {
            next(new TokenMismatchException('CSRF token mismatch.'))
        }
    }

    addCookieToResponse(request, response) {
        request.cookie.set(this.$cookieName, request.session.token(), { httpOnly: false })

    }

    inExceptArray($request) {
        for (let $except of this.$except) {
            if ($request.fullUrlIs($except)) {
                return true;
            }
        }

        return false;
    }

    tokensMatch($request) {
        let $token = this.getTokenFromRequest($request);
        return (typeof $request.session.token() == 'string') &&
            (typeof $token == 'string') &&
            tokens.verify(this.$app.config['app']['key'], $token);
    }

    getTokenFromRequest($request) {
        let $token = $request.input('_token') ? $request.input('_token') : $request.header('X-CSRF-TOKEN');
        let $header = $request.header('X-XSRF-TOKEN')
        if (!$token && $header) {
            $token = $header
        }

        return $token;
    }

    shouldAddXsrfTokenCookie() {
        return this.$addHttpCookie;
    }

    isReading($request) {
        return ['HEAD', 'GET', 'OPTIONS'].includes($request.method);
    }

}

module.exports = VerifyCsrfToken