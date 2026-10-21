import '@ostro/support/helpers';
import ValidatesRequests from '../src/validation/validatesRequests';
import Authorizable from '../src/auth/access/authorizable';
import GuardResolver from '../src/auth/guardResolver';
import User from '../src/auth/user';
import ConsoleSupportServiceProvider from '../src/support/providers/consoleSupportServiceProvider';
import RouteServiceProvider from '../src/providers/routeServiceProvider';
import FoundationServiceProvider from '../src/providers/foundationServiceProvider';
import Request from '@ostro/http/request';
import FileRequest from '@ostro/http/file';
import Facade from '@ostro/support/facades/facade';

describe('Auth, Validation, and Providers', () => {
    test("Authorizable, GuardResolver, and ConsoleSupportServiceProvider", () => {
        const authorizable = new Authorizable();
        expect(authorizable).toBeInstanceOf(Authorizable);

        const guard = new GuardResolver();
        expect(guard).toBeInstanceOf(GuardResolver);

        const appMock: any = { register: jest.fn() };
        const consoleProvider = new ConsoleSupportServiceProvider(appMock);
        expect(consoleProvider.$providers).toHaveLength(2);
    });

    test("ValidatesRequests delegates to app validation factory", async () => {
        const mockValidator = {
            validate: jest.fn((data, rules, messages, customAttributes) => {
                if (rules.fail) {
                    return Promise.reject(new Error("Validation error"));
                }
                return Promise.resolve(data);
            })
        };
        (global as any).app = jest.fn((k) => {
            if (k === "validation") return mockValidator;
            return null;
        });

        const validator = new ValidatesRequests();
        const req = {
            all: () => ({ email: "test@example.com" })
        };

        const validated = await validator.validate(req, { email: "required" });
        expect(validated).toEqual({ email: "test@example.com" });

        // validateWithBag failure attaches errorBag and rejects
        await expect(validator.validateWithBag("customBag", req, { fail: true })).rejects.toThrow();
    });

    test("User model creates API token", async () => {
        const mockEncrypter = {
            encrypt: jest.fn((val) => "encrypted_" + val)
        };
        const appFacadeMock = {
            encrypter: mockEncrypter
        };
        Facade.setFacadeApplication(appFacadeMock);

        const user = new User();
        user.getKeyName = () => "id";
        user.getAttribute = (k: any) => 42;
        user.setApiToken = jest.fn();
        user.save = jest.fn().mockResolvedValue(true);

        const tokenResult = await user.createToken();
        expect(tokenResult).toHaveProperty("accessToken");
        expect(user.setApiToken).toHaveBeenCalledWith(tokenResult.accessToken);
        expect(user.save).toHaveBeenCalled();
    });

    test('RouteServiceProvider lifecycle stubs', () => {
        const appMock: any = {
            singleton: jest.fn()
        };
        const provider = new RouteServiceProvider(appMock);
        expect(() => {
            provider.register();
            provider.boot();
            provider.routes();
            provider.setRootControllerNamespace();
            provider.routesAreCached();
            provider.loadCachedRoutes();
            provider.loadRoutes();
        }).not.toThrow();
    });

    test('FoundationServiceProvider registers validation macro and filesystem hooks', () => {
        const appMock: any = {
            validation: {
                validate: jest.fn((data, rules, msg) => ({ valid: true }))
            },
            whenHas: jest.fn((key, cb) => {
                if (key === 'filesystem') {
                    cb({
                        registerToRequest: jest.fn()
                    });
                }
            })
        };

        const provider = new FoundationServiceProvider(appMock);
        provider.register();
        provider.boot();

        // Check Request macro 'validate' was defined
        const req: any = new Request({});
        req.all = () => ({ username: 'user1' });
        const result = req.validate({ username: 'required' }, {});
        expect(result).toEqual({ valid: true });
        expect(appMock.whenHas).toHaveBeenCalledWith('filesystem', expect.any(Function));
    });
});

describe('FoundationServiceProvider 100% branch coverage', () => {
    test('macro validate default arguments', () => {
        const appMock: any = {
            validation: {
                validate: jest.fn((data, rules, msg) => ({ valid: true, rules, msg }))
            },
            whenHas: jest.fn()
        };
        const provider = new FoundationServiceProvider(appMock);
        provider.register();

        const req: any = new Request({});
        req.all = () => ({});
        const res = req.validate();
        expect(res.rules).toEqual({});
        expect(res.msg).toEqual({});
    });
});
