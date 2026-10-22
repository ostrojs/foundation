import LocaleUpdated from '../src/events/localeUpdated';
import Application from '../src/application';
import HttpRequest from '../src/http/request';
import HttpResponse from '../src/http/response';
import HttpContext from '../src/http/httpContext';
import ViewHelpers from '../src/view/helpers';
import WhoopsHandler from '../src/exception/handlers/whoops';
import ProductionHandler from '../src/exception/handlers/production';
import JsonHandler from '../src/exception/handlers/json';
import path from 'path';
import fs from 'fs';

describe('Foundation Comprehensive Integration and Edge-Case Tests', () => {
    let originalCwd: string;

    beforeAll(() => {
        originalCwd = process.cwd();
    });

    afterAll(() => {
        try {
            process.chdir(originalCwd);
        } catch {}
    });

    test('LocaleUpdated event correctly initializes and carries locale state', () => {
        const eventFr = new LocaleUpdated('fr');
        expect(eventFr).toBeInstanceOf(LocaleUpdated);
        expect(eventFr.locale).toBe('fr');

        const eventEn = new LocaleUpdated('en_US');
        expect(eventEn.locale).toBe('en_US');
    });

    test('HttpRequest edge cases: routeIs with wildcards and null routes', () => {
        const req = new HttpRequest({});
        
        // Mock router with named route matching wildcards
        const mockRoute: any = {
            $name: 'admin.users.index'
        };
        const mockRouter = {
            currentRoute: jest.fn().mockReturnValue(mockRoute)
        };
        (global as any).app = (k: string) => (k === 'router' ? mockRouter : null);

        expect(req.routeIs('admin.*')).toBe(true);
        expect(req.routeIs('admin.users.*')).toBe(true);
        expect(req.routeIs('admin.posts.*')).toBe(false);

        // Exact match
        expect(req.routeIs('admin.users.index')).toBe(true);

        // When route has no name
        mockRoute.$name = null;
        expect(req.routeIs('admin.*')).toBe(false);

        // When currentRoute is null
        mockRouter.currentRoute.mockReturnValue(null);
        expect(req.routeIs('admin.*')).toBe(false);
    });

    test('HttpResponse withInput and withErrors chaining', () => {
        const sessionMock = {
            flash: jest.fn(),
            flashInput: jest.fn(),
            get: jest.fn()
        };
        const reqMock: any = {
            session: sessionMock,
            input: jest.fn().mockReturnValue({ username: 'testuser' }),
            all: jest.fn().mockReturnValue({ username: 'testuser', pass: '123' }),
            except: jest.fn((field: string) => ({ username: 'testuser' }))
        };
        const res = new HttpResponse({});
        res.request = reqMock;

        // withInput with explicit object
        const chained = res.withInput({ custom: 'val' });
        expect(chained).toBe(res);
        expect(sessionMock.flash).toHaveBeenCalledWith('__inputs', { custom: 'val' });

        // withInput with true (uses req.except('_token'))
        res.withInput(true);
        expect(reqMock.except).toHaveBeenCalledWith('_token');
        expect(sessionMock.flash).toHaveBeenCalledWith('__inputs', { username: 'testuser' });

        // withErrors
        res.withErrors({ field: ['Error message'] });
        expect(sessionMock.flash).toHaveBeenCalledWith('__errors', { field: ['Error message'] });
    });

    test('HttpContext holds request, response, and session context and csrf helpers', () => {
        const sessionMock: any = {
            token: jest.fn().mockReturnValue('token_xyz')
        };
        const viewMock = jest.fn();
        const reqMock: any = {
            url: '/test',
            session: sessionMock,
            auth: { user: { id: 10 } },
            params: { id: '10' }
        };
        const resMock: any = {
            statusCode: 200,
            view: viewMock
        };

        const ctx = new HttpContext(reqMock, resMock, () => {});
        expect(ctx.request).toBe(reqMock);
        expect(ctx.response).toBe(resMock);
        expect(ctx.auth).toEqual({ user: { id: 10 } });
        expect(typeof ctx.view).toBe('function');
        expect(ctx.session).toBe(sessionMock);
        expect(ctx.params).toEqual({ id: '10' });
        expect(ctx.csrf_token()).toBe('token_xyz');
        expect(ctx.csrfToken()).toBe('token_xyz');
    });

    test('ViewHelpers asset URL edge cases with port and secure protocols', () => {
        const reqMock: any = {
            get: jest.fn((header: string) => {
                if (header === 'host') return 'example.com:8080';
                return null;
            }),
            protocol: jest.fn(() => 'https'),
            session: { get: jest.fn() },
            auth: { user: null },
            old: jest.fn(),
            error: jest.fn(),
            path: jest.fn(() => '/dashboard')
        };
        const httpMock: any = { request: reqMock, csrfToken: jest.fn() };
        const configMock: any = {
            get: jest.fn((k: string) => {
                if (k === 'app.asset_url') return null;
                if (k === 'app.url') return 'https://example.com:8080';
                return null;
            })
        };
        const appMock: any = { config: configMock };

        const helpers = new ViewHelpers(appMock, httpMock);
        expect(helpers.asset('build', 'bundle.js')).toBe('https://example.com:8080/build/bundle.js');
        expect(helpers.secure_asset('build', 'bundle.js')).toBe('https://example.com:8080/build/bundle.js');
        expect(helpers.absolutePath()).toBe('https://example.com:8080/dashboard');
    });

    test('Exception Handlers: Whoops, Production, and Json handlers format exceptions correctly', () => {
        const error = new Error('Test application crash');
        error.stack = 'Error: Test application crash\n    at Object.<anonymous>';

        const mockReq: any = {
            wantJson: () => false,
            ajax: () => false
        };
        const mockRes: any = {
            headersSent: false,
            writeHead: jest.fn(),
            send: jest.fn(),
            json: jest.fn()
        };

        // 1. Whoops Handler
        const whoops = new WhoopsHandler();
        const ouchMock = {
            handleException: jest.fn()
        };
        (whoops as any)[Object.getOwnPropertySymbols(whoops)[0]] = ouchMock;
        whoops.render(mockReq, mockRes, error);
        expect(mockRes.writeHead).toHaveBeenCalledWith(500, { 'Content-Type': 'text/html' });
        expect(ouchMock.handleException).toHaveBeenCalled();

        // 2. Production Handler (wantJson = true)
        const prod = new ProductionHandler();
        mockReq.wantJson = () => true;
        prod.render(mockReq, mockRes, error);
        expect(mockRes.send).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Test application crash' }),
            500
        );

        // 3. Json Handler
        const jsonHandler = new JsonHandler();
        const jsonOuchMock = {
            handleException: jest.fn((err, req, res, cb) => {
                cb(JSON.stringify({ error: { type: 'Error', message: 'Test error', line: 1 } }));
            })
        };
        (jsonHandler as any)[Object.getOwnPropertySymbols(jsonHandler)[0]] = jsonOuchMock;
        jsonHandler.render(mockReq, mockRes, error);
        expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'Error', message: 'Test error' }),
            500
        );
    });

    test('Application service provider and path getters under various conditions', () => {
        const tmpAppPath = path.join(__dirname, 'tmp_full_app');
        fs.mkdirSync(tmpAppPath, { recursive: true });

        const app = new Application(tmpAppPath);
        app.env = 'development';
        expect(app.isLocal()).toBe(false);
        expect(app.isProduction()).toBe(false);

        app.env = 'local';
        expect(app.isLocal()).toBe(true);

        app.env = 'production';
        expect(app.isProduction()).toBe(true);

        // View paths fallback
        expect(app.viewPath('views')).toBe(path.normalize(tmpAppPath + '/resources/view/views'));

        // Maintenance mode test
        const maintFile = path.join(tmpAppPath, 'storage/framework/down');
        fs.mkdirSync(path.dirname(maintFile), { recursive: true });
        expect(app.isDownForMaintenance()).toBe(false);
        fs.writeFileSync(maintFile, 'down');
        expect(app.isDownForMaintenance()).toBe(true);

        // Reset cwd before deleting
        process.chdir(originalCwd);
        fs.rmSync(tmpAppPath, { recursive: true, force: true });
    });
});
