declare var app: any, route: any;
import PageNotFoundException from '@ostro/contracts/http/pageNotFoundException';
import validationException from '@ostro/contracts/validation/validationException';
import TokenMismatchException from '@ostro/contracts/http/tokenMismatchException';
import FileNotFoundException from '@ostro/contracts/filesystem/fileNotFoundException';
import FileUploadException from '@ostro/contracts/filesystem/fileUploadException';
import JsonException from '@ostro/contracts/http/jsonException';
import Redirect from '@ostro/contracts/http/redirectResponse';
import Session from '@ostro/contracts/session/session';
import AuthenticationException from '@ostro/auth/authenticationException';
import { except } from '@ostro/support/object';
import path from 'path';
import fs from 'fs';

// Framework globals: app, route

const kHandle: unique symbol = Symbol('handle');
const kLogger: unique symbol = Symbol('logger');

/**
 * Class Handler.
 */
class Handler {
    public $dontReport: any[] = [
        validationException,
        JsonException,
        Redirect,
        TokenMismatchException
    ];

    public $dontFlash: string[] = [];

    public [kHandle]: any;
    public [kLogger]: any;

    /**
     * Create a new instance.
     * @param handler - Exception handler instance
     */
    constructor(handler: Function | any) {
        this[kHandle] = handler;
        const appFn: any = typeof app === 'function' ? app : (typeof (global as any).app === 'function' ? (global as any).app : null);
        this[kLogger] = appFn ? appFn('logger') : null;
    }

    /**
     * handle method.
     * @param request - Request instance
     * @param response - Response instance
     * @param $e - Error object
     */
    public handle(request: any, response: any, $e: Record<string, any> = {}): void {
        this.render(request, response, $e);
    }

    /**
     * terminate method.
     * @param request - Request instance
     * @param response - Response instance
     * @param $e - Error object
     */
    public terminate(request: any, response: any, $e: Record<string, any> = {}): void {
        this.report($e);
    }

    /**
     * render method.
     * @param request - Request instance
     * @param response - Response instance
     * @param $e - Error object
     */
    public render(request: any, response: any, $e: Record<string, any> = {}): void {
        if ($e instanceof PageNotFoundException) {
            this.pageNotFoundException(request, response, $e);
        } else if ($e instanceof validationException) {
            this.convertValidationExceptionToResponse(request, response, $e);
        } else if ($e instanceof TokenMismatchException) {
            this.tokenMismatchException(request, response, $e);
        } else if ($e instanceof AuthenticationException) {
            this.unauthenticated(request, response, $e);
        } else if ($e instanceof Redirect) {
            this.redirect(response, $e);
        } else if ($e instanceof FileNotFoundException) {
            response.send({
                name: ($e as any).name,
                message: ($e as any).message
            }, ($e as any).statusCode);
        } else if ($e instanceof FileUploadException) {
            response.send({
                name: ($e as any).name,
                message: ($e as any).message
            }, ($e as any).statusCode);
        } else if ($e instanceof JsonException) {
            response.send({
                name: ($e as any).name,
                message: ($e as any).message,
                errors: ($e as any).errors
            }, ($e as any).statusCode);
        } else if (typeof ($e as any).message === 'object') {
            this[kHandle].render(
                request,
                response,
                $e
            );
        } else {
            this[kHandle].render(
                request,
                response,
                $e
            );
        }
        this.report($e);
    }

    /**
     * unauthenticated method.
     * @param $request - Request instance
     * @param $response - Response instance
     * @param $exception - Authentication exception
     */
    public unauthenticated($request: any, $response: any, $exception: any): any {
        return $request.expectsJson() ?
            $response.json({ 'message': $exception.message }, 401) :
            $response.redirect().to($exception.redirectTo() || route('login'));
    }

    /**
     * redirect method.
     * @param response - Response instance
     * @param $e - Redirect exception
     */
    public redirect(response: any, $e: any): void {
        response.with(...$e.getFlash()).withErrors(...$e.getErrors()).withInput($e.wantedInput()).redirect($e.getUrl());
    }

    /**
     * jsonException method.
     * @param response - Response instance
     * @param $e - Json exception
     */
    public jsonException(response: any, $e: any): void {

    }

    /**
     * send method.
     * @param request - Request instance
     * @param response - Response instance
     * @param $e - Error object
     */
    public send(request: any, response: any, $e: Record<string, any> = {}): void {
        this.report($e);
        response.send($e);
    }

    /**
     * convertValidationExceptionToResponse method.
     * @param request - Request instance
     * @param response - Response instance
     * @param $e - Validation exception
     */
    public convertValidationExceptionToResponse(request: any, response: any, $e: any): any {
        if ($e.response) {
            return $e.response;
        }

        return request.expectsJson() ?
            this.invalidJson(request, response, $e) :
            this.invalid(request, response, $e);
    }

    /**
     * invalidJson method.
     * @param request - Request instance
     * @param response - Response instance
     * @param $exception - Validation exception
     */
    public invalidJson(request: any, response: any, $exception: any): any {
        return response.json({
            'message': $exception.getMessage(),
            'errors': $exception.getErrors(),
        }, $exception.status);
    }

    /**
     * invalid method.
     * @param request - Request instance
     * @param response - Response instance
     * @param $exception - Validation exception
     */
    public invalid(request: any, response: any, $exception: any): void {
        if (request.session instanceof Session) {
            response.withInput(except(request.input(), this.$dontFlash))
                .withErrors($exception.all());
        }
        response.redirect($exception.redirectTo || 'back');
    }

    /**
     * tokenMismatchException method.
     * @param request - Request instance
     * @param response - Response instance
     * @param $e - Token mismatch exception
     */
    public tokenMismatchException(request: any, response: any, $e: any): any {
        if (request.wantJson() || request.ajax()) {
            response.send({
                name: ($e as any).name || 'Token mismatch exception',
                errors: ($e as any).errors || {},
                message: ($e as any).message || 'Page Expired'
            }, (($e as any).statusCode || 403));
        } else {
            return fs.readFile(path.join(__dirname, 'template/errors/403'), {
                encoding: 'utf8'
            }, function (error: any, data: any) {
                response.send(data, ($e as any).statusCode);
            });
        }
    }

    /**
     * pageNotFoundException method.
     * @param request - Request instance
     * @param response - Response instance
     * @param $e - Page not found exception
     */
    public pageNotFoundException(request: any, response: any, $e: any): any {
        return fs.readFile(path.join(__dirname, 'template/errors/404'), {
            encoding: 'utf8'
        }, function (error: any, data: any) {
            response.send(data, ($e as any).statusCode);
        });
    }

    /**
     * report method.
     * @param $e - Error object
     */
    public report($e: any): void {
        if (!this.$dontReport.find((clazz: any) => $e instanceof clazz)) {
            if (typeof this[kLogger].getConfig === 'function' && !this[kLogger].getConfig('ignore_exceptions')) {
                if ($e && typeof $e === 'object') {
                    if (typeof $e.stack === 'string') {
                        $e.capture = $e.stack.split('\n    at ');
                    }
                }
                this[kLogger].error($e);
            }
        }
    }

    /**
     * renderForConsole method.
     * @param $e - Error object
     */
    public renderForConsole($e: any): void {
        this[kLogger].channel('console').error($e);
    }
}

export default Handler;
