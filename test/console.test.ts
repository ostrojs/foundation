import ConsoleKernel from '../src/console/kernel';
import ConsoleMakeCommand from '../src/console/consoleMakeCommand';
import EventMakeCommand from '../src/console/eventMakeCommand';
import EventGenerateCommand from '../src/console/eventGenerateCommand';
import KeyGenerateCommand from '../src/console/keyGenerateCommand';
import ModelMakeCommand from '../src/console/modelMakeCommand';
import ResourceMakeCommand from '../src/console/resourceMakeCommand';
import ServeCommand from '../src/console/serveCommand';
import ServerBootstrapCommand from '../src/console/serverBootstrapCommand';
import ServerlessBootstrapCommand from '../src/console/serverlessBootstrapCommand';
import StorageLinkCommand from '../src/console/storageLinkCommand';
import fs = require('fs');
import path = require('path');

describe('Console Kernel and Commands', () => {
    let tmpDir;
    let appMock;

    beforeEach(() => {
        tmpDir = path.join(__dirname, 'tmp_console');
        fs.mkdirSync(tmpDir, { recursive: true });
        global.base_path = (p = '') => path.join(tmpDir, p);
        global.public_path = (p = '') => path.join(tmpDir, 'public', p);
        global.storage_path = (p = '') => path.join(tmpDir, 'storage', p);
        global.app_path = (p = '') => path.join(tmpDir, 'app', p);

        appMock = {
            basePath: (p = '') => path.join(tmpDir, p),
            configPath: (p = '') => path.join(tmpDir, 'config', p),
            environmentFilePath: () => path.join(tmpDir, '.env'),
            version: () => '1.1.5',
            hasBeenBootstrapped: jest.fn().mockReturnValue(true),
            bootstrapWith: jest.fn(),
            loadDeferredProviders: jest.fn(),
            config: {
                'app.cipher': 'AES-256-CBC',
                'app.key': '',
                'filesystems.links': null
            },
            make: jest.fn((cmd) => {
                const _Cmd = require('@ostro/console/command');
                const Command = _Cmd.default || _Cmd;
                class MockConsoleCmd extends Command {
                    $signature = 'mock:test';
                    $description = 'Mock test command';
                }
                return new MockConsoleCmd();
            }),
            '@ostro/contracts/exception/handler': {
                report: jest.fn(),
                renderForConsole: jest.fn()
            }
        };
        ConsoleKernel.prototype.$app = appMock;
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    test('ConsoleKernel bootstrap, getAssistant, callCommand, handle, load, and exception handlers', async () => {
        class TestConsoleKernel extends ConsoleKernel {
            commands() {
                this.load(tmpDir);
            }
        }

        // Test unbootstrapped branch
        appMock.hasBeenBootstrapped.mockReturnValue(false);
        const kernel = new TestConsoleKernel();
        expect(appMock.bootstrapWith).toHaveBeenCalled();
        expect(appMock.loadDeferredProviders).toHaveBeenCalled();
        expect(kernel.getBootstrappers()).toHaveLength(5);
        kernel.schedule({});

        // Test already bootstrapped branch
        appMock.hasBeenBootstrapped.mockReturnValue(true);
        kernel.bootstrap();

        // Test load with string file, directory, function, and array
        const dummyFile = path.join(tmpDir, 'dummyCmd.js');
        fs.writeFileSync(dummyFile, 'module.exports = function() {};\n');
        kernel.load(dummyFile);
        kernel.load(tmpDir);
        kernel.load([dummyFile]);
        kernel.load(() => {});

        // Test callCommand
        const assistantMock = {
            call: jest.fn().mockReturnValue('command_executed'),
            run: jest.fn().mockResolvedValue(true),
            getAutoExit: jest.fn().mockReturnValue(0),
            resolveCommands: jest.fn().mockReturnThis()
        };
        kernel.assistant = assistantMock;
        // Test callCommand with arguments and defaults
        const callRes = kernel.callCommand('test:cmd', ['arg1'], 'buffer');
        expect(callRes).toBe('command_executed');
        expect(assistantMock.call).toHaveBeenCalledWith('test:cmd', ['arg1'], 'buffer');

        kernel.callCommand('test:default');
        expect(assistantMock.call).toHaveBeenCalledWith('test:default', [], null);

        // Test handle success and exception
        const origExit = process.exit;
        process.exit = jest.fn();

        await kernel.handle('input');
        expect(assistantMock.run).toHaveBeenCalledWith('input', null);
        expect(process.exit).toHaveBeenCalledWith(0);

        // Error path in handle
        const err = new Error('Handle failure');
        assistantMock.run.mockRejectedValueOnce(err);
        await kernel.handle('input_err');
        expect(appMock['@ostro/contracts/exception/handler'].report).toHaveBeenCalledWith(err);
        expect(appMock['@ostro/contracts/exception/handler'].renderForConsole).toHaveBeenCalledWith(err);

        process.exit = origExit;

        // Default getAssistant caching
        const assistant = kernel.getAssistant();
        expect(assistant).toBe(assistantMock);

        // Test getAssistant when assistant is not yet initialized
        const newKernel = new ConsoleKernel(appMock);
        const resolvedAssistant = newKernel.getAssistant();
        expect(resolvedAssistant).toBeDefined();

        // Test kernel.commands()
        newKernel.commands();

        // Test callback inside load() for function
        const _AssistantClass = require('@ostro/console');
        const AssistantClass = _AssistantClass.default || _AssistantClass;
        const bootstrappers = AssistantClass.$bootstrappers || [];
        const lastBootstrapper = bootstrappers[bootstrappers.length - 1];
        if (lastBootstrapper) {
            const mockAsst = { resolve: jest.fn() };
            lastBootstrapper(mockAsst);
            expect(mockAsst.resolve).toHaveBeenCalled();
        }
    });

    test('ConsoleMakeCommand replaceClass, getStub, resolveStubPath, getDefaultNamespace', async () => {
        const fileMock = {
            exists: jest.fn().mockResolvedValue(false)
        };
        const cmd = new ConsoleMakeCommand();
        cmd.$app = appMock;
        cmd.$file = fileMock;

        // replaceClass
        cmd.option = jest.fn().mockReturnValue('make:custom');
        cmd.argument = jest.fn().mockReturnValue('CustomCommand');
        let stub = 'class DummyClass extends Command {\n    $signature = \'dummy:command\';\n}';
        let replaced = cmd.replaceClass(stub, 'custom:name');
        expect(replaced).toContain('make:custom');

        // option null fallback to argument name
        cmd.option = jest.fn().mockReturnValue(null);
        replaced = cmd.replaceClass(stub, 'custom:name');
        expect(replaced).toContain('CustomCommand');

        // getStub & resolveStubPath
        const stubPath = await cmd.getStub();
        expect(stubPath).toContain('stubs/console.stub');

        fileMock.exists.mockResolvedValueOnce(true);
        const customStubPath = await cmd.resolveStubPath('/stubs/console.stub');
        expect(customStubPath).toBe(path.join(tmpDir, 'stubs/console.stub'));

        // getDefaultNamespace
        expect(cmd.getDefaultNamespace('root')).toBe(path.join('root', 'app', 'console', 'commands'));
    });

    test('EventMakeCommand alreadyExists, getStub, resolveStubPath, getDefaultNamespace', async () => {
        const fileMock = {
            exists: jest.fn().mockResolvedValue(false)
        };
        const cmd = new EventMakeCommand();
        cmd.$app = appMock;
        cmd.$file = fileMock;

        cmd.qualifyClass = (n) => n;
        cmd.getPath = (n) => `/path/${n}`;
        expect(cmd.alreadyExists('UserRegistered')).resolves.toBe(false);

        const stubPath = await cmd.getStub();
        expect(stubPath).toContain('stubs/event.stub');

        fileMock.exists.mockResolvedValueOnce(true);
        const customStubPath = await cmd.resolveStubPath('/stubs/event.stub');
        expect(customStubPath).toBe(path.join(tmpDir, 'stubs/event.stub'));

        expect(cmd.getDefaultNamespace('root')).toBe(path.join('root', 'app', 'events'));
    });

    test('EventGenerateCommand handle, makeEventAndListeners, makeListeners', async () => {
        const cmd = new EventGenerateCommand();
        cmd.info = jest.fn();
        cmd.callSilent = jest.fn();

        await cmd.handle();
        expect(cmd.info).toHaveBeenCalledWith('Events and listeners generated successfully!');

        // makeEventAndListeners with event not containing '\' -> returns early
        cmd.makeEventAndListeners('SimpleEvent', []);
        expect(cmd.callSilent).not.toHaveBeenCalled();

        // makeEventAndListeners with event containing '\'
        cmd.makeEventAndListeners('App\\Events\\UserCreated', ['App\\Listeners\\SendEmail@handle']);
        expect(cmd.callSilent).toHaveBeenCalledWith('make:event', { name: 'App\\Events\\UserCreated' });
        expect(cmd.callSilent).toHaveBeenCalledWith('make:listener', {
            name: 'App\\Listeners\\SendEmail',
            '--event': 'App\\Events\\UserCreated'
        });
    });

    test('KeyGenerateCommand handle, ciphers, write to env file, and show option', async () => {
        const fileMock = {
            get: jest.fn().mockResolvedValue('APP_NAME=Ostro\nAPP_KEY=\n'),
            put: jest.fn().mockResolvedValue(true)
        };
        const cmd = new KeyGenerateCommand(fileMock);
        cmd.$app = appMock;
        cmd.line = jest.fn();
        cmd.info = jest.fn();
        cmd.option = jest.fn();
        cmd.confirmToProceed = jest.fn().mockResolvedValue(true);

        // Test generateRandomKey for different ciphers
        appMock.config['app.cipher'] = 'AES-128-CBC';
        expect(cmd.generateRandomKey().startsWith('base64:')).toBe(true);
        appMock.config['app.cipher'] = 'AES-192-CBC';
        expect(cmd.generateRandomKey().startsWith('base64:')).toBe(true);
        appMock.config['app.cipher'] = 'AES-256-CBC';
        expect(cmd.generateRandomKey().startsWith('base64:')).toBe(true);

        // Show option
        cmd.option.mockImplementation((k) => k === 'show');
        await cmd.handle();
        expect(cmd.line).toHaveBeenCalled();

        // Write key
        cmd.option.mockReturnValue(false);
        await cmd.handle();
        expect(fileMock.put).toHaveBeenCalled();
        expect(cmd.info).toHaveBeenCalledWith('Application key set successfully.');

        // Current key exists but confirmToProceed false -> does not proceed
        appMock.config['app.key'] = 'existing_key';
        cmd.confirmToProceed.mockResolvedValueOnce(false);
        const result = await cmd.setKeyInEnvironmentFile('new_key');
        expect(result).toBe(false);

        // setKeyInEnvironmentFile returning false inside handle()
        cmd.confirmToProceed.mockResolvedValueOnce(false);
        cmd.info.mockClear();
        await cmd.handle();
        expect(cmd.info).not.toHaveBeenCalled();
    });

    test('ModelMakeCommand handle options: all, factory, migration, seed, controller, stubs', async () => {
        const fileMock = {
            exists: jest.fn().mockResolvedValue(false)
        };
        const cmd = new ModelMakeCommand();
        cmd.$app = appMock;
        cmd.$file = fileMock;
        cmd.callCommand = jest.fn().mockResolvedValue(true);
        cmd.qualifyClass = (n) => `App\\Models\\${n}`;
        cmd.getNameInput = () => 'Post';
        cmd.argument = (k) => 'Post';
        cmd.getFileName = (n) => n;
        cmd.getNamespace = (n) => 'App\\Models';

        // Check $dirname
        const dirnameGetter = Object.getOwnPropertyDescriptor(ModelMakeCommand.prototype, '$dirname').get;
        expect(dirnameGetter()).toBe(path.join(__dirname, '../src/console'));
        expect(cmd.$dirname).toBeDefined();

        const options = {
            all: true,
            force: false,
            factory: true,
            migration: true,
            seed: true,
            controller: true,
            resource: true,
            api: false
        };
        cmd.option = (k) => options[k];
        cmd.input = {
            hasOption: (k) => k in options,
            getOption: (k) => options[k],
            setOption: (k, v) => { options[k] = v; }
        };

        const origHandle = Object.getPrototypeOf(ModelMakeCommand.prototype).handle;
        Object.getPrototypeOf(ModelMakeCommand.prototype).handle = jest.fn().mockResolvedValue(true);

        // Handle with all options
        await cmd.handle();
        expect(cmd.callCommand).toHaveBeenCalledWith('make:factory', expect.any(Object));
        expect(cmd.callCommand).toHaveBeenCalledWith('make:migration', expect.any(Object));
        expect(cmd.callCommand).toHaveBeenCalledWith('make:seeder', expect.any(Object));
        expect(cmd.callCommand).toHaveBeenCalledWith('make:controller', expect.any(Object));

        // Test with individual options and without resource
        // Test with controller: true
        options.all = false;
        options.factory = false;
        options.migration = false;
        options.seed = false;
        options.api = false;
        options.controller = true;
        options.resource = false;
        cmd.callCommand.mockClear();
        await cmd.handle();
        expect(cmd.callCommand).toHaveBeenCalledWith('make:controller', { name: 'PostController' });

        // Test with api: true
        options.controller = false;
        options.api = true;
        options.pivot = true;
        cmd.callCommand.mockClear();
        await cmd.handle();
        expect(cmd.callCommand).toHaveBeenCalledWith('make:controller', { name: 'PostController' });

        // Test with resource option only
        options.api = false;
        options.controller = false;
        options.resource = true;
        cmd.callCommand.mockClear();
        await cmd.handle();
        expect(cmd.callCommand).toHaveBeenCalledWith('make:controller', {
            name: 'PostController',
            '--model': 'App\\Models\\Post'
        });

        // Test when controller, resource, and api are all false
        options.api = false;
        options.controller = false;
        options.resource = false;
        cmd.callCommand.mockClear();
        await cmd.handle();
        expect(cmd.callCommand).not.toHaveBeenCalled();

        // super.handle returning true with force: true
        options.force = true;
        Object.getPrototypeOf(ModelMakeCommand.prototype).handle = jest.fn().mockResolvedValue(false);
        const resForce = await cmd.handle();
        expect(resForce).toBeUndefined();

        // Stubs & paths
        options.pivot = false;
        const stub = await cmd.getStub();
        expect(stub).toContain('stubs/model.stub');

        options.pivot = true;
        const pivotStub = await cmd.getStub();
        expect(pivotStub).toContain('stubs/model.pivot.stub');
        options.pivot = false;

        fileMock.exists.mockResolvedValueOnce(true);
        const customStubPath = await cmd.resolveStubPath('stubs/model.stub');
        expect(customStubPath).toBe(path.join(tmpDir, 'stubs/model.stub'));

        // getDefaultNamespace
        expect(cmd.getDefaultNamespace('models.js')).toBe('models.js');
        expect(cmd.getDefaultNamespace(tmpDir)).toBe(path.resolve(tmpDir, 'app/models'));

        // super.handle() returning false without force
        Object.getPrototypeOf(ModelMakeCommand.prototype).handle = jest.fn().mockResolvedValue(false);
        options.force = false;
        const res = await cmd.handle();
        expect(res).toBe(false);
        Object.getPrototypeOf(ModelMakeCommand.prototype).handle = origHandle;
    });

    test('ResourceMakeCommand handle, collection, getStub, resolveStubPath, getDefaultNamespace', async () => {
        const fileMock = {
            exists: jest.fn().mockResolvedValue(false)
        };
        const cmd = new ResourceMakeCommand();
        cmd.$app = appMock;
        cmd.$file = fileMock;
        cmd.argument = () => 'UserResource';
        const options = { collection: false };
        cmd.option = (k) => options[k];
        cmd.input = {
            hasOption: (k) => k in options,
            getOption: (k) => options[k]
        };

        // super.handle mock
        const origHandle = Object.getPrototypeOf(ResourceMakeCommand.prototype).handle;
        Object.getPrototypeOf(ResourceMakeCommand.prototype).handle = jest.fn().mockResolvedValue(true);

        // Not collection
        await cmd.handle();
        expect(cmd.$type).toBe('Resource');
        let stub = await cmd.getStub();
        expect(stub).toContain('stubs/resource.stub');

        // Is collection via option
        options.collection = true;
        await cmd.handle();
        expect(cmd.$type).toBe('Resource collection');
        stub = await cmd.getStub();
        expect(stub).toContain('stubs/resource-collection.stub');

        // Is collection via name endsWith 'Collection'
        options.collection = false;
        cmd.argument = () => 'UserCollection';
        expect(cmd.collection()).toBe(true);

        // resolveStubPath custom exists
        fileMock.exists.mockResolvedValueOnce(true);
        const customStub = await cmd.resolveStubPath('/stubs/resource.stub');
        expect(customStub).toBe(path.join(tmpDir, 'stubs/resource.stub'));

        // getDefaultNamespace
        expect(cmd.getDefaultNamespace('root')).toBe(path.join('root', 'app', 'http', 'resources'));

        Object.getPrototypeOf(ResourceMakeCommand.prototype).handle = origHandle;
    });

    test('ServeCommand handle, host, port, canTryAnotherPort', async () => {
        const cmd = new ServeCommand({}, {});
        cmd.line = jest.fn();
        let requiredFile = null;
        cmd.requireServerFile = (p) => { requiredFile = p; };
        const opts = {
            host: '127.0.0.1',
            port: 3000,
            tries: 5
        };
        cmd.input = {
            getOption: (k) => opts[k]
        };

        expect(cmd.serverStarterPath()).toBe(path.join(tmpDir, 'app.js'));
        await cmd.handle();
        expect(cmd.line).toHaveBeenCalledWith(expect.stringContaining('http://127.0.0.1:3000'));
        expect(process.env.PORT).toBe('3000');
        expect(process.env.HOST).toBe('127.0.0.1');
        expect(requiredFile).toBe(path.join(tmpDir, 'app.js'));

        expect(cmd.canTryAnotherPort()).toBe(false);
        opts.port = null;
        expect(cmd.canTryAnotherPort()).toBe(true);

        // requireServerFile implementation
        const realCmd = new ServeCommand();
        const dummyReqFile = path.join(tmpDir, 'testRequire.js');
        fs.writeFileSync(dummyReqFile, 'module.exports = { loaded: true };\n');
        expect(realCmd.requireServerFile(dummyReqFile)).toEqual({ loaded: true });
    });

    test('ServerBootstrapCommand handle, force, and configureRootApp', async () => {
        let filesMap = {};
        const fileMock = {
            exists: jest.fn(async (p) => !!filesMap[p]),
            get: jest.fn(async (p) => filesMap[p]),
            put: jest.fn(async (p, c) => { filesMap[p] = c; }),
            delete: jest.fn(async (p) => { delete filesMap[p]; })
        };
        const cmd = new ServerBootstrapCommand(fileMock);
        cmd.$app = appMock;
        cmd.error = jest.fn();
        cmd.info = jest.fn();
        cmd.option = jest.fn().mockReturnValue(false);

        expect(cmd.getAppConfigFile()).toBe(path.join(tmpDir, 'config/app.js'));

        // Serverless exists without force -> error
        const serverlessFile = path.join(tmpDir, 'serverless.js');
        filesMap[serverlessFile] = '// serverless';
        await cmd.handle();
        expect(cmd.error).toHaveBeenCalledWith('Serverless is already active. Use --force to overwrite.');

        // Serverless does not exist
        delete filesMap[serverlessFile];
        cmd.option.mockReturnValue(false);
        const appJs = path.join(tmpDir, 'app.js');
        filesMap[appJs] = `
            server.type('serverless');
            server.handler('serverless.handler');
            server.start();
        `;
        await cmd.handle();
        expect(cmd.info).toHaveBeenCalledWith('Serverless application bootstrapped successfully.');

        // With force -> replaces server.type('serverless') and removes server.handler('serverless.handler')
        filesMap[serverlessFile] = '// serverless';
        cmd.option.mockReturnValue(true);
        await cmd.handle();
        expect(cmd.info).toHaveBeenCalledWith('Serverless application bootstrapped successfully.');
        expect(filesMap[appJs]).toContain("server.type('server')");
        expect(filesMap[appJs]).not.toContain("server.handler('serverless.handler')");
        expect(filesMap[appJs]).toContain("server.register(kernel.handle())");

        // Re-run handle when app.js already has server.type('server') and server.register(kernel.handle())
        await cmd.handle();
        expect(cmd.info).toHaveBeenCalled();

        // Error during configureRootApp
        fileMock.get.mockRejectedValueOnce(new Error('Read error'));
        await cmd.handle();
        expect(cmd.error).toHaveBeenCalledWith('Error during serverless bootstrap: Read error');

        await cmd.removeServerlessFile();
        expect(filesMap[serverlessFile]).toBeUndefined();
    });

    test('ServerlessBootstrapCommand handle, force, generate files, configureRootApp', async () => {
        let filesMap = {};
        const fileMock = {
            exists: jest.fn(async (p) => !!filesMap[p]),
            get: jest.fn(async (p) => filesMap[p] || '// stub content'),
            put: jest.fn(async (p, c) => { filesMap[p] = c; }),
            delete: jest.fn(async (p) => { delete filesMap[p]; })
        };
        const cmd = new ServerlessBootstrapCommand(fileMock);
        cmd.$app = appMock;
        cmd.error = jest.fn();
        cmd.info = jest.fn();
        cmd.option = jest.fn().mockReturnValue(false);

        expect(cmd.getAppConfigFile()).toBe(path.join(tmpDir, 'config/app.js'));

        // Serverless exists without force
        const serverlessFile = path.join(tmpDir, 'serverless.js');
        filesMap[serverlessFile] = '// serverless';
        await cmd.handle();
        expect(cmd.error).toHaveBeenCalledWith('Serverless application already bootstrapped. Use --force to overwrite.');

        // With force -> replaces server.type('server') with serverless
        cmd.option.mockReturnValue(true);
        const appJs = path.join(tmpDir, 'app.js');
        filesMap[appJs] = `
            server.type('server');
            server.register(kernel.handle());
            server.start();
        `;
        await cmd.handle();
        expect(cmd.info).toHaveBeenCalledWith('Serverless application bootstrapped successfully.');
        expect(filesMap[appJs]).toContain("server.type('serverless')");
        expect(filesMap[appJs]).not.toContain("server.register(kernel.handle())");

        // Branch when neither server.type exists
        filesMap[serverlessFile] = null;
        filesMap[appJs] = `server.start();`;
        await cmd.handle();
        expect(filesMap[appJs]).toContain("server.type('serverless');");

        // Error during bootstrap
        fileMock.put.mockRejectedValueOnce(new Error('Put failed'));
        await cmd.handle();
        expect(cmd.error).toHaveBeenCalledWith('Error during serverless bootstrap: Put failed');
    });

    test('StorageLinkCommand handle, relative, links from config and defaults', async () => {
        let filesMap = {};
        const fileMock = {
            exists: jest.fn(async (p) => !!filesMap[p]),
            delete: jest.fn(async (p) => { delete filesMap[p]; }),
            link: jest.fn(async (target, link) => { filesMap[link] = target; }),
            relativeLink: jest.fn(async (target, link) => { filesMap[link] = target; })
        };
        const cmd = new StorageLinkCommand(fileMock);
        cmd.$app = appMock;
        cmd.error = jest.fn();
        cmd.info = jest.fn();
        const opts = { relative: false, force: false };
        cmd.option = (k) => opts[k];

        // Default links
        const links = cmd.links();
        expect(links).toBeDefined();

        // Run handle with link not existing
        await cmd.handle();
        expect(fileMock.link).toHaveBeenCalled();
        expect(cmd.info).toHaveBeenCalledWith('The links have been created.');

        // Run handle with relative: true
        opts.relative = true;
        filesMap = {};
        fileMock.link.mockClear();
        await cmd.handle();
        expect(fileMock.relativeLink).toHaveBeenCalled();

        // Link already exists without force -> error
        const linkPath = Object.keys(links)[0];
        filesMap[linkPath] = 'existing';
        await cmd.handle();
        expect(cmd.error).toHaveBeenCalledWith(`The [${linkPath}] link already exists.`);

        // isRemovableSymlink
        expect(await cmd.isRemovableSymlink(linkPath, false)).toBe(false);
        expect(await cmd.isRemovableSymlink(linkPath, true)).toBe(false);

        // When isSymbolicLink returns true and force: true
        const origIsSymlink = global.isSymbolicLink;
        global.isSymbolicLink = async () => true;
        opts.force = true;
        opts.relative = false;
        await cmd.handle();
        expect(fileMock.delete).toHaveBeenCalledWith(linkPath);
        expect(fileMock.link).toHaveBeenCalled();
        global.isSymbolicLink = origIsSymlink;
    });
});
