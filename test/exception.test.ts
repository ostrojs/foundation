const proc = process as unknown as { mainModule?: { filename: string } };
proc.mainModule = proc.mainModule || { filename: __filename };
import { describe, test, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import Handler from '../src/exception/handler';
import ExceptionManager from '../src/exception/handlerManager';
import ExceptionMiddleware from '../src/exception/middleware/exceptionHandler';
import JsonHandler from '../src/exception/handlers/json';
import WhoopsHandler from '../src/exception/handlers/whoops';
import ProductionHandler from '../src/exception/handlers/production';
import PageNotFoundException from '@ostro/contracts/http/pageNotFoundException';
import ValidationException from '@ostro/contracts/validation/validationException';
import TokenMismatchException from '@ostro/contracts/http/tokenMismatchException';
import FileNotFoundException from '@ostro/contracts/filesystem/fileNotFoundException';
import FileUploadException from '@ostro/contracts/filesystem/fileUploadException';
import JsonException from '@ostro/contracts/http/jsonException';
import Redirect from '@ostro/contracts/http/redirectResponse';
import AuthenticationException from '@ostro/auth/authenticationException';
import InvalidArgumentException from '@ostro/support/exceptions/invalidArgumentException';
import SessionContract from '@ostro/contracts/session/session';
import fs from 'node:fs';
import path from 'node:path';

describe('Exception handling system', () => {
    let appMock;
    let loggerMock;
    let logs = [];
    let exceptionManager;

    beforeEach(() => {
        logs = [];
        loggerMock = {
            getConfig: jest.fn(() => false),
            error: jest.fn((e) => logs.push(e)),
            channel: jest.fn(() => ({
                error: jest.fn((e) => logs.push('console:' + e))
            }))
        };
        appMock = {
            logger: loggerMock,
            make: jest.fn((key) => {
                if (key === '@ostro/contracts/exception/handler') {
                    return exceptionManager;
                }
                return null;
            }),
            config: {
                'app.debug': true
            }
        };
        global.app = (k) => appMock[k] || appMock;
    });

    test('HandlerManager creates handlers, adapts, and allows extensions', () => {
        class MockAdapter {
            constructor(driver) {
                this.driver = driver;
            }
            render() { return 'rendered'; }
            terminate() { return 'terminated'; }
        }

        const manager = new ExceptionManager(MockAdapter);
        manager.$app = appMock;
        exceptionManager = manager;

        // whoops handler
        const whoops = manager.handler('whoops');
        expect(whoops).toBeInstanceOf(MockAdapter);

        // cached
        expect(manager.handler('whoops')).toBe(whoops);

        // json handler
        const json = manager.get('json');
        expect(json).toBeInstanceOf(MockAdapter);

        // production handler when debug = false
        appMock.config['app.debug'] = false;
        const prod = manager.handler('any');
        expect(prod).toBeInstanceOf(MockAdapter);

        // Custom extension
        manager.extend('custom', () => ({ customDriver: true }));
        const custom = manager.get('custom');
        expect(custom.driver.customDriver).toBe(true);
        // extends alias
        manager.extends('custom2', () => ({ customDriver: 2 }));
        expect(manager.get('custom2').driver.customDriver).toBe(2);

        // Unsupported handler throws
        expect(() => manager.get('unknown_driver')).toThrow('Handler [{unknown_driver}] do not supported.');

        // Invalid adapter throws
        manager.setHandlerAdapter(null);
        expect(() => manager.adapt({})).toThrow(InvalidArgumentException);

        // __call proxy
        manager.setHandlerAdapter(MockAdapter);
        expect(manager.render()).toBe('rendered');
    });

    test('Json and Whoops handlers render without errors', () => {
        const jsonHandler = new JsonHandler();
        const resMock = {
            json: jest.fn()
        };
        const err = new Error('JSON error test');
        err.statusCode = 422;
        err.errors = { field: ['invalid'] };
        jsonHandler.render({}, resMock, err);
        expect(resMock.json).toHaveBeenCalled();

        const whoopsHandler = new WhoopsHandler();
        const writeHeadMock = jest.fn();
        const resWhoops = {
            headersSent: false,
            writeHead: writeHeadMock,
            end: jest.fn(),
            setHeader: jest.fn()
        };
        const reqWhoops = {
            headers: {},
            connection: { remoteAddress: '127.0.0.1' },
            method: 'GET',
            url: '/'
        };
        whoopsHandler.render(reqWhoops, resWhoops, new Error('Whoops error test'));
        expect(writeHeadMock).toHaveBeenCalled();

        // when headersSent is true
        resWhoops.headersSent = true;
        writeHeadMock.mockClear();
        whoopsHandler.render(reqWhoops, resWhoops, new Error('Whoops error test 2'));
        expect(writeHeadMock).not.toHaveBeenCalled();
    });

    test('Production handler renders for json and html requests', (done) => {
        const prodHandler = new ProductionHandler();
        prodHandler.register();
        const resJson = {
            send: jest.fn((data, status) => {
                expect(status).toBe(500);
                expect(data.name).toBe('CustomError');
            })
        };
        const customErr = { message: 'Prod error', name: 'CustomError' };
        prodHandler.render({ wantJson: () => true, ajax: () => false }, resJson, customErr);

        // Default name when none provided
        const resJsonDef = {
            send: jest.fn((data, status) => {
                expect(data.name).toBe('HttpException');
            })
        };
        prodHandler.render({ wantJson: () => true, ajax: () => false }, resJsonDef, {});

        const resHtml = {
            send: jest.fn((data, status) => {
                expect(status).toBe(500);
                expect(data).toBeDefined();
                done();
            })
        };
        prodHandler.render({ wantJson: () => false, ajax: () => false }, resHtml, new Error('Prod error'));
    });

    test('Handler class render and report for all exception types', (done) => {
        const innerHandler = {
            render: jest.fn()
        };
        const handler = new Handler(innerHandler);

        // PageNotFoundException
        const reqNotFound = {};
        const resNotFound = {
            send: jest.fn((data, code) => {
                expect(code).toBe(404);
            })
        };
        const notFoundErr = new PageNotFoundException();
        notFoundErr.statusCode = 404;
        handler.handle(reqNotFound, resNotFound, notFoundErr);

        // TokenMismatchException
        const reqCsrfJson = { wantJson: () => true, ajax: () => false };
        const resCsrfJson = { send: jest.fn() };
        const csrfErr = new TokenMismatchException('Token mismatch');
        csrfErr.statusCode = 403;
        handler.handle(reqCsrfJson, resCsrfJson, csrfErr);
        expect(resCsrfJson.send).toHaveBeenCalled();

        const reqCsrfHtml = { wantJson: () => false, ajax: () => false };
        const resCsrfHtml = {
            send: jest.fn((data, code) => {
                expect(code).toBe(403);
            })
        };
        handler.handle(reqCsrfHtml, resCsrfHtml, csrfErr);

        // AuthenticationException
        const reqAuthJson = { expectsJson: () => true };
        const resAuthJson = { json: jest.fn() };
        const authErr = new AuthenticationException('Unauthenticated');
        handler.handle(reqAuthJson, resAuthJson, authErr);
        expect(resAuthJson.json).toHaveBeenCalledWith({ message: 'Unauthenticated' }, 401);

        const redirectObj = { to: jest.fn() };
        const reqAuthHtml = { expectsJson: () => false };
        const resAuthHtml = { redirect: () => redirectObj };
        global.route = () => '/login';
        handler.handle(reqAuthHtml, resAuthHtml, authErr);
        expect(redirectObj.to).toHaveBeenCalledWith('/login');

        // Redirect exception
        const redirectErr = new Redirect('/target');
        redirectErr.getFlash = () => ['key', 'val'];
        redirectErr.getErrors = () => [{ err: 1 }];
        redirectErr.wantedInput = () => ({ input: 2 });
        redirectErr.getUrl = () => '/target';
        const resRedirect = {
            with: jest.fn().mockReturnThis(),
            withErrors: jest.fn().mockReturnThis(),
            withInput: jest.fn().mockReturnThis(),
            redirect: jest.fn()
        };
        handler.handle({}, resRedirect, redirectErr);
        expect(resRedirect.redirect).toHaveBeenCalledWith('/target');

        // FileNotFoundException & FileUploadException & JsonException
        const fnfErr = new FileNotFoundException('File not found');
        fnfErr.statusCode = 404;
        const resFnf = { send: jest.fn() };
        handler.handle({}, resFnf, fnfErr);
        expect(resFnf.send).toHaveBeenCalled();

        const fuErr = new FileUploadException('Upload failed');
        fuErr.statusCode = 500;
        const resFu = { send: jest.fn() };
        handler.handle({}, resFu, fuErr);
        expect(resFu.send).toHaveBeenCalled();

        const jsonErr = new JsonException('Invalid JSON', 400);
        jsonErr.errors = { bad: true };
        const resJsonContract = { send: jest.fn() };
        handler.handle({}, resJsonContract, jsonErr);
        expect(resJsonContract.send).toHaveBeenCalled();

        // ValidationException branch in render()
        const valErr = new ValidationException();
        valErr.response = { renderedValidation: true };
        handler.render({}, {}, valErr);

        // Generic error with object message and string message
        handler.handle({}, {}, { message: { complex: true } });
        expect(innerHandler.render).toHaveBeenCalled();

        handler.handle({}, {}, new Error('Regular error'));
        expect(innerHandler.render).toHaveBeenCalled();

        // send() method
        const resSend = { send: jest.fn() };
        handler.send({}, resSend, 'direct error');
        expect(resSend.send).toHaveBeenCalledWith('direct error');

        // jsonException method
        handler.jsonException({}, {});

        // renderForConsole
        handler.renderForConsole('Console error message');
        expect(logs.some(l => String(l).includes('Console error message'))).toBe(true);

        // terminate
        handler.terminate({}, {}, new Error('Terminate error'));

        setTimeout(() => {
            done();
        }, 50);
    });

    test('ValidationException converts to JSON or Redirect', () => {
        const handler = new Handler({});
        const valErr = new ValidationException({});
        valErr.status = 422;
        valErr.getMessage = () => 'Validation failed';
        valErr.getErrors = () => ({ email: ['required'] });
        valErr.all = () => ({ email: ['required'] });

        // If response already present
        valErr.response = { custom: true };
        expect(handler.convertValidationExceptionToResponse({}, {}, valErr)).toBe(valErr.response);
        delete valErr.response;

        // JSON response
        const reqJson = { expectsJson: () => true };
        const resJson = { json: jest.fn() };
        handler.convertValidationExceptionToResponse(reqJson, resJson, valErr);
        expect(resJson.json).toHaveBeenCalled();

        // Redirect response with Session
        class MockSession extends SessionContract {}
        const reqHtml = {
            expectsJson: () => false,
            session: new MockSession(),
            input: () => ({ password: 'secret', name: 'john' })
        };
        const resHtml = {
            withInput: jest.fn().mockReturnThis(),
            withErrors: jest.fn().mockReturnThis(),
            redirect: jest.fn()
        };
        handler.convertValidationExceptionToResponse(reqHtml, resHtml, valErr);
        expect(resHtml.redirect).toHaveBeenCalledWith('back');
    });

    test('ExceptionMiddleware handles and terminates', () => {
        const mockManager = {
            handler: jest.fn().mockReturnValue({
                handle: jest.fn(),
                terminate: jest.fn()
            })
        };
        const middleware = Object.create(ExceptionMiddleware.prototype);
        middleware.$exceptionHandler = mockManager;

        // AJAX request -> json handler
        middleware.handle(new Error('err'), {
            request: { ajax: () => true, wantJson: () => false },
            response: {}
        }, jest.fn());
        expect(mockManager.handler).toHaveBeenCalledWith('json');

        // Non-AJAX request -> whoops handler
        middleware.handle(new Error('err'), {
            request: { ajax: () => false, wantJson: () => false },
            response: {}
        }, jest.fn());
        expect(mockManager.handler).toHaveBeenCalledWith('whoops');

        // terminate -> json handler
        middleware.terminate(new Error('err'), {
            request: {},
            response: {}
        }, jest.fn());
        expect(mockManager.handler).toHaveBeenCalledWith('json');

        // constructor with $app
        ExceptionMiddleware.prototype.$app = appMock;
        const constructed = new ExceptionMiddleware();
        expect(constructed.$exceptionHandler).toBe(exceptionManager);
    });
});

describe('Handler branch completeness', () => {
    test('covers default parameters, non-session invalid, report without stack, and dontReport list', () => {
        const innerHandler = { render: jest.fn() };
        const handler = new Handler(innerHandler);

        // handle with default $e
        handler.handle({}, {});

        // terminate with default $e
        handler.terminate({}, {});

        // render with default $e
        handler.render({}, {});

        // invalid with request.session NOT instance of Session
        const res = { redirect: jest.fn() };
        handler.invalid({ session: null }, res, { redirectTo: '/somewhere' });
        expect(res.redirect).toHaveBeenCalledWith('/somewhere');

        // report with non-object $e
        handler.report('plain error string');

        // report with object without stack
        handler.report({ noStack: true });

        // report with ignore_exceptions = true
        app('logger').getConfig.mockReturnValueOnce(true);
        handler.report(new Error('ignored'));

        // report when logger.getConfig is not a function
        const originalLogger = handler[Object.getOwnPropertySymbols(handler).find(s => s.description !== 'handle')];
        // Test dontReport item
        handler.report(new ValidationException());
    });
});

describe('Handler 100% branch coverage', () => {
    test('tokenMismatchException default statusCode, send() default $e, and tokenMismatch with all defaults', () => {
        const handler = new Handler({});
        const res = { send: jest.fn() };
        // tokenMismatchException with wantJson but no properties on $e
        handler.tokenMismatchException({ wantJson: () => true }, res, {});
        expect(res.send).toHaveBeenCalledWith({
            name: 'Token mismatch exception',
            errors: {},
            message: 'Page Expired'
        }, 403);

        // send() with default $e
        handler.send({}, res);
        expect(res.send).toHaveBeenCalledWith({});
    });
});

describe("Handlers 100% branch coverage", () => {
    test("JsonHandler with and without custom statusCode and errors", () => {
        const jsonHandler = new JsonHandler();
        const resMock = { json: jest.fn() };
        const err = new Error("err");
        jsonHandler.render({}, resMock, err);
        expect(resMock.json).toHaveBeenCalled();

        const err2 = new Error("err2");
        err2.statusCode = 400;
        err2.errors = { a: 1 };
        jsonHandler.render({}, resMock, err2);
        expect(resMock.json).toHaveBeenCalledWith(expect.objectContaining({ errors: { a: 1 } }), 400);
    });

    test("ProductionHandler default $exception and non-default properties", () => {
        const prodHandler = new ProductionHandler();
        const resMock = { send: jest.fn() };
        prodHandler.render({ wantJson: () => true }, resMock);
        expect(resMock.send).toHaveBeenCalledWith({
            name: "HttpException",
            errors: {},
            message: "Whoops look like somthing wrong"
        }, 500);

        prodHandler.render({ wantJson: () => true }, resMock, {
            name: "CustomErr",
            errors: { err: true },
            message: "Custom message",
            statusCode: 503
        });
        expect(resMock.send).toHaveBeenCalledWith({
            name: "CustomErr",
            errors: { err: true },
            message: "Custom message"
        }, 503);
    });

    test("JsonHandler empty error and parsedObj fallback", () => {
        class MockJsonHandler extends JsonHandler {
            public register() {
                return {
                    handleException: (_e: unknown, _req: unknown, _res: unknown, cb: (data: string) => void) => {
                        cb(JSON.stringify({}));
                    }
                };
            }
        }
        const jsonHandler = new MockJsonHandler();
        const resMock = { json: jest.fn() };
        jsonHandler.render({}, resMock);
        expect(resMock.json).toHaveBeenCalledWith({
            name: undefined,
            message: undefined,
            errors: {},
            file: undefined,
            line: undefined,
            trace: undefined
        }, 500);
    });

    test("WhoopsHandler default $exception", () => {
        class MockWhoopsHandler extends WhoopsHandler {
            public register() {
                return {
                    handleException: jest.fn()
                };
            }
        }
        const whoopsHandler = new MockWhoopsHandler();
        const writeHead = jest.fn();
        const resMock = {
            headersSent: false,
            writeHead
        };
        whoopsHandler.render({}, resMock);
        expect(writeHead).toHaveBeenCalledWith(500, { "Content-Type": "text/html" });
    });
});