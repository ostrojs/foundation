const PageNotFoundException = require('@ostro/contracts/http/pageNotFoundException')
const validationException = require('@ostro/contracts/validation/validationException')
const TokenMismatchException = require('@ostro/contracts/http/tokenMismatchException')
const FileNotFoundException = require('@ostro/contracts/filesystem/fileNotFoundException')
const FileUploadException = require('@ostro/contracts/filesystem/fileUploadException')
const JsonException = require('@ostro/contracts/http/jsonException')
const Redirect = require('@ostro/contracts/http/redirectResponse')
const Session = require('@ostro/contracts/session/session')
const AuthenticationException = require('@ostro/auth/authenticationException')
const path = require('path')
const fs = require('fs')
const kHandle = Symbol('handle')
const kLogger = Symbol('logger')

class Handler {
    $dontReport = [
        validationException,
        JsonException,
        Redirect,
        TokenMismatchException
    ];

    $dontFlash = [];

    constructor(handler) {
        this[kHandle] = handler
        this[kLogger] = app('logger')
    }

    handle(request, response, $e = {}) {
        this.render(request, response, $e)
    }

    terminate(request, response, $e = {}) {
        this.report($e)
    }

    render(request, response, $e = {}) {
        if ($e instanceof PageNotFoundException) {
            this.pageNotFoundException(request, response, $e)
        } else if ($e instanceof validationException) {
            this.convertValidationExceptionToResponse(request, response, $e);
        } else if ($e instanceof TokenMismatchException) {
            this.tokenMismatchException(request, response, $e)
        } else if ($e instanceof AuthenticationException) {
            this.unauthenticated(request, response, $e);
        } else if ($e instanceof Redirect) {
            this.redirect(response, $e)
        } else if ($e instanceof FileNotFoundException) {
            response.send({
                name: $e.name,
                message: $e.message
            }, $e.statusCode)
        } else if ($e instanceof FileUploadException) {
            response.send({
                name: $e.name,
                message: $e.message
            }, $e.statusCode)
        } else if ($e instanceof JsonException) {
            response.send({
                name: $e.name,
                message: $e.message,
                errors: $e.errors
            }, $e.statusCode)
        } else if (typeof $e.message == 'object') {
            this[kHandle].render(
                request,
                response,
                $e
            )
        } else {
            this[kHandle].render(
                request,
                response,
                $e
            )
        }
        this.report($e)


    }

    unauthenticated($request, $response, $exception) {
        return $request.expectsJson() ?
            $response.json({ 'message': $exception.message }, 401) :
            $response.redirect().to($exception.redirectTo() || route('login'));
    }

    redirect(response, $e) {
        response.with(...$e.getFlash()).withErrors(...$e.getErrors()).withInput($e.wantedInput()).redirect($e.getUrl());
    }

    jsonException(response, $e) {

    }

    send(request, response, $e = {}) {
        this.report($e)
        response.send($e)
    }

    convertValidationExceptionToResponse(request, response, $e) {
        if ($e.response) {
            return $e.response;
        }

        return request.expectsJson() ?
            this.invalidJson(request, response, $e) :
            this.invalid(request, response, $e);
    }

    invalidJson(request, response, $exception) {
        return response.json({
            'message': $exception.getMessage(),
            'errors': $exception.getErrors(),
        }, $exception.status);
    }

    invalid(request, response, $exception) {

        if (request.session instanceof Session) {
            response.withInput(Object.except(request.input(), this.$dontFlash))
                .withErrors($exception.all())
        }
        response.redirect($exception.redirectTo || 'back')
    }

    tokenMismatchException(request, response, $e) {
        if (request.wantJson() || request.ajax()) {
            response.send({
                name: $e.name || 'Token mismatch exception',
                errors: $e.errors || {},
                message: $e.message || 'Page Expired'
            }, ($e.statusCode || 403))
        } else {
            return fs.readFile(path.join(__dirname, 'template/errors/403'), {
                encoding: 'utf8'
            }, function (error, data) {
                response.send(data, $e.statusCode)
            })
        }
    }
    pageNotFoundException(request, response, $e) {
        return fs.readFile(path.join(__dirname, 'template/errors/404'), {
            encoding: 'utf8'
        }, function (error, data) {
            response.send(data, $e.statusCode)
        })
    }
    report($e) {
        if (!this.$dontReport.find((clazz) => $e instanceof clazz)) {
            if (typeof this[kLogger].getConfig == 'function' && !this[kLogger].getConfig('ignore_exceptions')) {
                if (typeof $e == 'object') {
                    if (typeof $e.stack == 'string') {
                        $e.capture = $e.stack.split('\n    at ')
                    }
                }
                this[kLogger].error($e)
            }
        }
    }
    renderForConsole($e) {
        this[kLogger].channel('console').error($e)
    }
}
module.exports = Handler
