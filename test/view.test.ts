import { describe, test, expect, jest } from "@jest/globals";
import ViewException from '../src/view/viewException';
import ViewHelpers from '../src/view/helpers';
import BindView from '../src/view/middleware/BindViewOnResponse';
import ViewEngine from '../src/view/viewEngine';
import path from 'node:path';

describe('View system', () => {
    test('ViewException creates proper error instance', () => {
        const errObj: any = new Error('View render failed');
        errObj.stack = 'Custom stack trace';
        const ve1 = new ViewException(errObj);
        expect(ve1.name).toBe('ViewException');
        expect(ve1.message).toBe('View render failed');
        expect(ve1.statusCode).toBe(500);
        expect(ve1.stack).toBe('Custom stack trace');

        const ve2 = new ViewException('String message');
        expect(ve2.message).toBe('String message');
        expect(ve2.stack).toBeDefined();
    });

    test('ViewHelpers methods and getters', () => {
        const reqMock: any = {
            get: jest.fn(() => 'localhost:3000'),
            protocol: jest.fn(() => 'http'),
            session: {
                get: jest.fn((k: string) => 'session_val_' + k)
            },
            auth: { user: { id: 1 } },
            old: jest.fn((k: string, def: any) => 'old_' + k),
            error: jest.fn(() => ({ hasError: false })),
            path: jest.fn(() => '/users/1')
        };
        const httpMock: any = {
            request: reqMock,
            csrfToken: jest.fn(() => 'test_csrf_token')
        };
        const configMock: any = {
            get: jest.fn((key: string, def: any) => {
                if (key === 'app.asset_url') return null;
                if (key === 'app.url') return 'http://localhost:3000';
                return def;
            })
        };
        const appMock: any = {
            config: configMock,
            router: {
                route: jest.fn((...args: any[]) => '/route/' + args.join('/'))
            },
            mix: {
                path: jest.fn((p: string) => '/mix/' + p)
            }
        };

        const helpers = new ViewHelpers(appMock, httpMock);

        // secure_asset with domain fallback
        expect(helpers.secure_asset('css', 'app.css')).toBe('https://localhost:3000/css/app.css');

        // secure_asset with config asset_url
        configMock.get.mockReturnValueOnce('https://cdn.example.com');
        expect(helpers.secure_asset('js', 'app.js')).toBe('https://cdn.example.com/js/app.js');

        // asset with protocol/host fallback
        expect(helpers.asset('img', 'logo.png')).toBe('http://localhost:3000/img/logo.png');

        // asset with config asset_url
        configMock.get.mockReturnValueOnce('https://cdn.example.com');
        expect(helpers.asset('img', 'logo.png')).toBe('https://cdn.example.com/img/logo.png');

        // session
        expect(helpers.session('user_id')).toBe('session_val_user_id');

        // auth getter
        expect(helpers.auth).toEqual({ user: { id: 1 } });

        // old
        expect(helpers.old('email', '')).toBe('old_email');

        // csrfToken and csrf_token
        expect(helpers.csrfToken()).toBe('test_csrf_token');
        expect(helpers.csrf_token()).toBe('test_csrf_token');

        // error getter
        expect(helpers.error).toEqual({ hasError: false });

        // route
        expect(helpers.route('home', 'index')).toBe('/route/home/index');

        // mix
        expect(helpers.mix('app.css')).toBe('/mix/app.css');

        // vite and viteAsset
        appMock.vite = {
            tags: jest.fn((e: any, b: any) => `<script src="/${b}/${e}"></script>`),
            asset: jest.fn((e: any, b: any) => `/${b}/${e}`)
        };
        expect(helpers.vite('app.js')).toBe('<script src="/build/app.js"></script>');
        expect(helpers.viteAsset('app.js')).toBe('/build/app.js');

        // absolutePath
        expect(helpers.absolutePath()).toBe('http://localhost:3000/users/1');
    });

    test('BindView middleware and ViewEngine render and error handling', (done) => {
        const appMock: any = {
            locals: { siteName: 'Ostro' },
            view: {
                engine: jest.fn(() => ({
                    renderFile: (file: string, data: any, cb: Function) => {
                        if (file === 'error.html') {
                            // Returns plain object that triggers ViewException
                            cb({ message: 'Render error' });
                        } else if (file === 'exception.html') {
                            cb(Promise.reject(new Error('Promise rejection in view')));
                        } else {
                            cb('<h1>Hello ' + data.name + '</h1>');
                        }
                    }
                }))
            }
        };

        const resMock: any = {
            send: jest.fn()
        };
        const httpMock: any = {
            request: { get: () => 'localhost' },
            response: resMock,
            session: {}
        };

        const bindView = new BindView();
        bindView.$app = appMock;

        let nextCalled = false;
        bindView.handle(httpMock, () => { nextCalled = true; });
        expect(nextCalled).toBe(true);

        const view = httpMock.response.view;
        expect(typeof view).toBe('function');

        // view.engine() setter
        view.engine('ejs');
        expect(httpMock.response.__viewEngine).toBe('ejs');

        // Render success via direct call fn()
        view('index.html', { name: 'World' }, 200);
        setTimeout(() => {
            expect(resMock.send).toHaveBeenCalledWith('<h1>Hello World</h1>', 200);

            // Render error object (throws ViewException)
            const nextMock = jest.fn();
            const viewWithError = new (ViewEngine as any)(appMock, httpMock, nextMock);
            viewWithError('error.html', {});

            setTimeout(() => {
                expect(nextMock).toHaveBeenCalledWith(expect.any(ViewException));

                // Render with promise exception
                const nextMock2 = jest.fn();
                const viewWithEx = new (ViewEngine as any)(appMock, httpMock, nextMock2);
                viewWithEx('exception.html', {});

                setTimeout(() => {
                    expect(nextMock2).toHaveBeenCalledWith(expect.any(Error));
                    done();
                }, 10);
            }, 10);
        }, 10);
    });
});

describe("ViewEngine 100% branch coverage", () => {
    test("covers app without locals and default data/status in fn and render", (done) => {
        const resMock: any = { send: jest.fn() };
        const appNoLocals: any = {
            view: {
                engine: jest.fn(() => ({
                    renderFile: (file: string, data: any, cb: Function) => {
                        cb("rendered content");
                    }
                }))
            }
        };
        const httpMock: any = {
            request: {},
            response: resMock,
            session: {}
        };
        const view = new (ViewEngine as any)(appNoLocals, httpMock, jest.fn());

        view("default.html");
        view.render("direct.html");

        setTimeout(() => {
            expect(resMock.send).toHaveBeenCalledWith("rendered content", 200);

            // Test 2-argument callback (err, content)
            const appWithErrContent: any = {
                view: {
                    engine: jest.fn(() => ({
                        renderFile: (file: string, data: any, cb: Function) => {
                            cb(null, "content from adapter");
                        }
                    }))
                }
            };
            const view2 = new (ViewEngine as any)(appWithErrContent, httpMock, jest.fn());
            view2("adapter.html");
            setTimeout(() => {
                expect(resMock.send).toHaveBeenCalledWith("content from adapter", 200);
                done();
            }, 20);
        }, 20);
    });
});
