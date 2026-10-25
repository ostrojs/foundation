import HttpContext from '@ostro/http/httpContext';
import type { IHttpContext } from '@ostro/contracts/foundation/httpContext';
import type { IHttpRequest } from '@ostro/contracts/http/request';
import type { IHttpResponse } from '@ostro/contracts/http/response';
import type { IAuthRequest } from '@ostro/contracts/auth/guard';

/**
 * Class FoundationHttpContext.
 */
class FoundationHttpContext extends HttpContext implements IHttpContext {
    public declare request: IHttpRequest;
    public declare response: IHttpResponse;
    public declare $app: any;

    /**
     * Create a new instance.
     * @param request - Request instance
     * @param response - Response instance
     * @param next - Next function
     */
    constructor(request: any, response: any, next?: Function) {
        super(request, response, next);
    }

    /**
     * Get auth.
     * @returns Auth object
     */
    public get auth(): IAuthRequest {
        return this.request.auth as IAuthRequest;
    }

    /**
     * Get view.
     * @returns View function
     */
    public get view(): any {
        return this.response.view;
    }

    /**
     * Get session.
     * @returns Session instance
     */
    public get session(): any {
        return this.request.session;
    }

    /**
     * Get params.
     * @returns Route parameters
     */
    public get params(): any {
        return this.request.params;
    }

    /**
     * csrf_token method.
     * @returns CSRF token string
     */
    public csrf_token(): string {
        return this.session.token() || '';
    }

    /**
     * csrfToken method.
     * @returns CSRF token string
     */
    public csrfToken(): string {
        return this.csrf_token();
    }
}

export type { IHttpContext };
export default FoundationHttpContext;