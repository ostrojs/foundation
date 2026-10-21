import '@ostro/support/helpers';
import HttpRequest from '../src/http/request';
import HttpResponse from '../src/http/response';
import HttpContext from '../src/http/httpContext';
import Kernel from '../src/http/kernel';
import ServeStatic from '../src/http/middleware/serveStatic';
import VerifyCsrfToken from '../src/http/middleware/verifyCsrfToken';
import TokenMismatchException from '@ostro/http/exception/tokenMismatchException';
import Model from '@ostro/contracts/database/eloquent/model';
import Collection from '@ostro/contracts/collection/collect';
import csrf from 'csrf';
const tokens = csrf();

describe('HTTP layer tests', () => {
    test('HttpRequest old, error, csrfToken, flash methods, and routeIs', () => {
        const sessionMock = {
            data: {
                __inputs: { username: 'john', email: 'john@example.com' },
                __errors: { email: ['Email already exists'] }
            },
            get(k) { return this.data[k]; },
            token() { return 'session_token_123'; },
            flash: jest.fn(),
            flashOnly: jest.fn(),
            flashExcept: jest.fn()
        };

        const req = new HttpRequest({});
        req.session = sessionMock;

        // old
        expect(req.old('username')).toBe('john');
        expect(req.old('nonexistent', 'default_val')).toBe('default_val');

        // error
        expect(req.error('email')).toBe('Email already exists');
        expect(req.error().get('email')).toEqual(['Email already exists']);

        // error when no session
        const reqNoSession = new HttpRequest({});
        expect(reqNoSession.error().get('email')).toBeNull();

        // csrfToken
        expect(req.csrfToken()).toBe('session_token_123');
        const reqEmptyToken = new HttpRequest({});
        reqEmptyToken.session = { token: () => null };
        expect(reqEmptyToken.csrfToken()).toBe('');

        // flash methods
        req.flash('key', 'val');
        expect(sessionMock.flash).toHaveBeenCalledWith('key', 'val');
        req.flashOnly(['a']);
        expect(sessionMock.flashOnly).toHaveBeenCalledWith(['a']);
        req.flashExcept(['b']);
        expect(sessionMock.flashExcept).toHaveBeenCalledWith(['b']);

        // routeIs
        const mockRouter = {
            currentRoute: jest.fn()
        };
        global.app = (k) => (k === 'router' ? mockRouter : null);

        // no current route
        mockRouter.currentRoute.mockReturnValueOnce(null);
        expect(req.routeIs('home')).toBe(false);

        // route without name
        mockRouter.currentRoute.mockReturnValueOnce({});
        expect(req.routeIs('home')).toBe(false);

        // exact match
        mockRouter.currentRoute.mockReturnValueOnce({ $name: 'users.index' });
        expect(req.routeIs('users.index')).toBe(true);

        // regex match
        mockRouter.currentRoute.mockReturnValueOnce({ $name: 'users.show' });
        expect(req.routeIs('^users\\.')).toBe(true);

        mockRouter.currentRoute.mockReturnValueOnce({ $name: 'posts.show' });
        expect(req.routeIs('^users\\.')).toBe(false);
    });

    test("HttpResponse send with Model, Collection, with, withInput, withErrors", () => {
        const res = new HttpResponse({
            setHeader: jest.fn(),
            getHeader: jest.fn(),
            hasHeader: jest.fn(),
            removeHeader: jest.fn(),
            end: jest.fn(),
            writeHead: jest.fn()
        });
        const sessionMock = { flash: jest.fn() };
        res.request = {
            session: sessionMock,
            except: jest.fn((k) => ({ input1: "val1" }))
        };

        // Model send
        class TestModel extends Model {
            serialize() { return { serialized: true }; }
        }
        res.send(new TestModel());

        // Collection array send
        class TestArrayCollection extends Collection {
            isArray() { return true; }
            toArray() { return ["item1"]; }
        }
        res.send(new TestArrayCollection());

        // Collection json send
        class TestJsonCollection extends Collection {
            isArray() { return false; }
            isJson() { return true; }
            toJSON() { return { json: true }; }
        }
        res.send(new TestJsonCollection());

        // with() string and object
        res.with("statusMsg", "saved");
        expect(sessionMock.flash).toHaveBeenCalledWith({ statusMsg: "saved" });
        res.with({ multi: 1 });
        expect(sessionMock.flash).toHaveBeenCalledWith({ multi: 1 });
        res.with(null);
        expect(sessionMock.flash).toHaveBeenCalledWith({});

        // withInput() with boolean true, string key, and object
        res.withInput(true);
        expect(sessionMock.flash).toHaveBeenCalledWith("__inputs", { input1: "val1" });

        res.withInput("username", "user1");
        expect(sessionMock.flash).toHaveBeenCalledWith("__inputs", { key: "user1" });

        res.withInput({ custom: "input" });
        expect(sessionMock.flash).toHaveBeenCalledWith("__inputs", { custom: "input" });

        res.withInput(null); // falsy key

        // withErrors
        res.withErrors({ field: ["error"] });
        expect(sessionMock.flash).toHaveBeenCalledWith("__errors", { field: ["error"] });
        res.withErrors();
    });

    test('HttpContext getters and csrf tokens', () => {
        const req = {
            url: '/test',
            auth: { user: 'u1' },
            session: { token: () => 'token_xyz' },
            params: { id: '99' }
        };
        const res = { view: { render: true } };
        const ctx = new HttpContext(req, res, jest.fn());

        expect(ctx.auth).toEqual({ user: 'u1' });
        expect(ctx.view).toEqual({ render: true });
        expect(ctx.session).toBe(req.session);
        expect(ctx.params).toEqual({ id: '99' });
        expect(ctx.csrf_token()).toBe('token_xyz');
        expect(ctx.csrfToken()).toBe('token_xyz');

        req.session.token = () => null;
        expect(ctx.csrf_token()).toBe('');
    });

    test('ServeStatic middleware serves static files with defaults and custom options', (done) => {
        global.$app = {
            'path.public': __dirname
        };
        const serveStatic = new ServeStatic();
        expect(serveStatic.$defaultOptions).toHaveProperty('maxAge', '180d');
        expect(serveStatic.$options).toEqual({});

        const req = { method: 'GET', url: '/nonexistent.txt', headers: {} };
        const res = { setHeader: jest.fn(), end: jest.fn(), statusCode: 200 };
        serveStatic.handle({ request: req, response: res }, (err) => {
            expect(err).toBeUndefined();
            done();
        });
    });

    test('VerifyCsrfToken handles reading requests, except array, and token verification', () => {
        const secretKey = tokens.secretSync();
        const validToken = tokens.create(secretKey);

        const appMock = {
            config: {
                app: { key: secretKey }
            }
        };

        const csrf = new VerifyCsrfToken();
        csrf.$app = appMock;
        csrf.$except = ['/webhook', 'https://example.com/api/*'];

        const reqCookie = { set: jest.fn() };
        const reqSession = { token: () => validToken };

        // 1. Reading request (GET) -> passes, adds cookie
        let nextCalled = false;
        csrf.handle({
            request: {
                method: 'GET',
                cookie: reqCookie,
                session: reqSession
            },
            response: {}
        }, () => { nextCalled = true; });
        expect(nextCalled).toBe(true);
        expect(reqCookie.set).toHaveBeenCalledWith('XSRF-TOKEN', validToken, { httpOnly: false });

        // 2. inExceptArray -> passes
        nextCalled = false;
        csrf.handle({
            request: {
                method: 'POST',
                fullUrlIs: (pattern) => pattern === '/webhook',
                cookie: reqCookie,
                session: reqSession
            },
            response: {}
        }, () => { nextCalled = true; });
        expect(nextCalled).toBe(true);

        // 3. Valid token from body input('_token') -> passes
        nextCalled = false;
        csrf.handle({
            request: {
                method: 'POST',
                fullUrlIs: () => false,
                input: (k) => (k === '_token' ? validToken : null),
                header: () => null,
                cookie: reqCookie,
                session: reqSession
            },
            response: {}
        }, () => { nextCalled = true; });
        expect(nextCalled).toBe(true);

        // 4. Valid token from X-CSRF-TOKEN header -> passes
        nextCalled = false;
        csrf.handle({
            request: {
                method: 'POST',
                fullUrlIs: () => false,
                input: () => null,
                header: (h) => (h === 'X-CSRF-TOKEN' ? validToken : null),
                cookie: reqCookie,
                session: reqSession
            },
            response: {}
        }, () => { nextCalled = true; });
        expect(nextCalled).toBe(true);

        // 5. Valid token from X-XSRF-TOKEN header -> passes
        nextCalled = false;
        csrf.handle({
            request: {
                method: 'POST',
                fullUrlIs: () => false,
                input: () => null,
                header: (h) => (h === 'X-XSRF-TOKEN' ? validToken : null),
                cookie: reqCookie,
                session: reqSession
            },
            response: {}
        }, () => { nextCalled = true; });
        expect(nextCalled).toBe(true);

        // 6. shouldAddXsrfTokenCookie false
        csrf.$addHttpCookie = false;
        reqCookie.set.mockClear();
        csrf.handle({
            request: {
                method: 'GET',
                cookie: reqCookie,
                session: reqSession
            },
            response: {}
        }, () => {});
        expect(reqCookie.set).not.toHaveBeenCalled();
        csrf.$addHttpCookie = true;

        // 7. Invalid token -> TokenMismatchException
        let caughtErr = null;
        csrf.handle({
            request: {
                method: 'POST',
                fullUrlIs: () => false,
                input: () => 'invalid_token',
                header: () => null,
                cookie: reqCookie,
                session: reqSession
            },
            response: {}
        }, (err) => { caughtErr = err; });
        expect(caughtErr).toBeInstanceOf(TokenMismatchException);
    });

    test('HTTP Kernel bootstraps, handles routing, middleware resolution, and getters', () => {
        const mockRouter = {
            defaultMiddlewares: jest.fn(),
            namedMiddleware: jest.fn(),
            httpContextHandler: jest.fn(),
            handle: jest.fn().mockReturnValue('router_handled')
        };
        const appMock = {
            hasBeenBootstrapped: jest.fn().mockReturnValue(false),
            bootstrapWith: jest.fn(),
            router: mockRouter
        };

        class TestKernel extends Kernel {
            constructor() {
                super();
            }
        }
        TestKernel.prototype.$app = appMock;

        const kernel = new TestKernel();
        expect(appMock.bootstrapWith).toHaveBeenCalled();

        // Already bootstrapped branch
        appMock.hasBeenBootstrapped.mockReturnValue(true);
        appMock.bootstrapWith.mockClear();
        kernel.bootstrap();
        expect(appMock.bootstrapWith).not.toHaveBeenCalled();

        // Middleware groups and named middlewares
        kernel.$namedMiddlewares = {
            auth: 'AuthMiddleware',
            guest: 'GuestMiddleware'
        };
        kernel.$middlewareGroups = {
            web: ['auth', { handle: jest.fn() }]
        };

        // handle()
        const result = kernel.handle();
        expect(result).toBe('router_handled');
        expect(mockRouter.defaultMiddlewares).toHaveBeenCalled();
        expect(mockRouter.namedMiddleware).toHaveBeenCalled();

        // Missing named middleware throws
        kernel.$middlewareGroups = {
            api: ['missing_named_middleware']
        };
        expect(() => kernel.handle()).toThrow('missing_named_middleware was not available on namedMiddlewares');

        // Getters and setters
        expect(kernel.getBootstrappers()).toHaveLength(6);
        expect(kernel.getMiddlewarePriority()).toHaveLength(2);
        expect(kernel.getMiddlewareGroups()).toBe(kernel.$middlewareGroups);
        expect(kernel.getApplication()).toBe(appMock);
        expect(kernel.getRouteMiddleware()).toBeUndefined();

        const anotherApp = { id: 2 };
        kernel.setApplication(anotherApp);
        expect(kernel.getApplication()).toBe(anotherApp);
    });
});
