import csrf from 'csrf';
import TokenMismatchException from '@ostro/http/exception/tokenMismatchException';

const tokens = new csrf();

/**
 * Class VerifyCsrfToken.
 */
class VerifyCsrfToken {
    public declare $app: any;
    public $cookieName: string = 'XSRF-TOKEN';
    public $addHttpCookie: boolean = true;
    public $except: string[] = [];

    /**
     * handle method.
     * @param context - Request and response context
     * @param next - Next middleware callback
     */
    public handle({ request, response }: Record<string, any>, next: Function): void {
        if (
            this.isReading(request) ||
            this.inExceptArray(request) ||
            this.tokensMatch(request)
        ) {
            if (this.shouldAddXsrfTokenCookie()) {
                this.addCookieToResponse(request, response);
            }
            next();
        } else {
            next(new TokenMismatchException('CSRF token mismatch.'));
        }
    }

    /**
     * addCookieToResponse method.
     * @param request - Request instance
     * @param response - Response instance
     */
    public addCookieToResponse(request: any, response: any): void {
        request.cookie.set(this.$cookieName, request.session.token(), { httpOnly: false });
    }

    /**
     * inExceptArray method.
     * @param $request - Request instance
     * @returns True if URL in except array
     */
    public inExceptArray($request: any): boolean {
        for (const $except of this.$except) {
            if ($request.fullUrlIs($except)) {
                return true;
            }
        }
        return false;
    }

    /**
     * tokensMatch method.
     * @param $request - Request instance
     * @returns True if CSRF tokens match
     */
    public tokensMatch($request: any): boolean {
        const $token = this.getTokenFromRequest($request);
        return (typeof $request.session.token() === 'string') &&
            (typeof $token === 'string') &&
            tokens.verify(this.$app.config['app']['key'], $token);
    }

    /**
     * getTokenFromRequest method.
     * @param $request - Request instance
     * @returns CSRF token from input or header
     */
    public getTokenFromRequest($request: any): string | undefined {
        let $token = $request.input('_token') ? $request.input('_token') : $request.header('X-CSRF-TOKEN');
        const $header = $request.header('X-XSRF-TOKEN');
        if (!$token && $header) {
            $token = $header;
        }

        return $token;
    }

    /**
     * shouldAddXsrfTokenCookie method.
     * @returns Whether to add XSRF-TOKEN cookie
     */
    public shouldAddXsrfTokenCookie(): boolean {
        return this.$addHttpCookie;
    }

    /**
     * isReading method.
     * @param $request - Request instance
     * @returns True if request is safe/reading
     */
    public isReading($request: any): boolean {
        return ['HEAD', 'GET', 'OPTIONS'].includes($request.method);
    }
}

export default VerifyCsrfToken;