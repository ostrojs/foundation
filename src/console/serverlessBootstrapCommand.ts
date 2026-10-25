import Command from '@ostro/console/command';
/**
 * Class ServerlessBootstrapCommand.
 */
class ServerlessBootstrapCommand extends Command {
    [key: string]: any;

    public get $signature(): string {
        return 'serverless:bootstrap';
    }

    public get $description(): string {
        return 'Bootstrap the serverless application';
    }

    public get $options(): any[] {
        return [
        this.createOption('--force', 'The port to serve the application on')
    ];
    }

    /**
     * Create a new instance.
     * @param {*} $file
     */
    constructor($file: any) {
        super()
        this.$file = $file
    }
    /**
     * getAppConfigFile method.
     * @returns {any}
     */
    public getAppConfigFile() {
        return this.$app.basePath('config/app.js')
    }

    /**
     * Determine if the application is using TypeScript.
     *
     * @returns {boolean}
     */
    public isTypeScript(): boolean {
        if (!this.$app) {
            return false;
        }
        try {
            if (this.$app['config']) {
                const configVal = typeof this.$app['config'].get === 'function' ?
                    this.$app['config'].get('app.typescript') :
                    this.$app['config']['app.typescript'];
                if (typeof configVal === 'boolean') {
                    return configVal;
                }
            }
        } catch (_) {}

        if (typeof super.isTypeScript === 'function') {
            return super.isTypeScript();
        }

        if (typeof this.$app.basePath !== 'function') {
            return false;
        }
        try {
            const fs = require('node:fs');
            return fs.existsSync(this.$app.basePath('tsconfig.json')) ||
                fs.existsSync(this.$app.basePath('tsconfig.build.json')) ||
                fs.existsSync(this.$app.basePath('app.ts'));
        } catch {
            return false;
        }
    }

    /**
     * handle method.
     * @async
     * @returns {any}
     */
    public async handle() {
        const ext = this.isTypeScript() ? '.ts' : '.js';
        const serverlessFile = this.$app.basePath(`serverless${ext}`);
        const force = this.option('force');
        const exists = await this.$file.exists(serverlessFile);

        if (exists && !force) {
            this.error('Serverless application already bootstrapped. Use --force to overwrite.');
            return;
        }

        try {
            await this.configureRootApp();
            await this.generateServerlessFile();
            await this.generateServerlessConfigFile();
        } catch (error: any) {
            this.error(`Error during serverless bootstrap: ${error.message}`);
            return;
        }
        this.info('Serverless application bootstrapped successfully.');
    }
    /**
     * configureRootApp method.
     * @async
     * @returns {any}
     */
    public async configureRootApp() {
        const ext = this.isTypeScript() ? '.ts' : '.js';
        const rootApp = this.$app.basePath(`app${ext}`);
        let content = await this.$file.get(rootApp);
        // Add server.type('serverless') before server.start() if not present
        // Handle server.type(): ensure it's serverless
        if (/server\.type\(['"]server['"]\)/.test(content)) {
            // Replace server.type('server') with server.type('serverless')
            content = content.replace(
                /server\.type\(['"]server['"]\)/g,
                "server.type('serverless')"
            );
        } else if (!/server\.type\(['"]serverless['"]\)/.test(content)) {
            // Add server.type('serverless') before server.start() if neither exists
            content = content.replace(
                /(server\.start\s*\(\s*)/,
                "server.type('serverless');\n\n$1"
            );
        }
        
        // Remove server.register(kernel.handle()) if it exists
        content = content.replace(
            /^\s*server\.register\(\s*kernel\.handle\s*\(\s*\{?\}?\s*\)\s*\)\s*;?\s*$/gm,
            ''
        );


        await this.$file.put(rootApp, content);

    }
    /**
     * generateServerlessFile method.
     * @async
     * @returns {any}
     */
    public async generateServerlessFile() {
        const isTs = this.isTypeScript();
        const ext = isTs ? '.ts' : '.js';
        const stubName = isTs ? '/stubs/serverless.ts.stub' : '/stubs/serverless.stub';
        const fullPath = this.$app.basePath(`serverless${ext}`);
        await this.$file.put(fullPath, await this.$file.get(__dirname + stubName));

    }
    /**
     * generateServerlessConfigFile method.
     * @async
     * @returns {any}
     */
    public async generateServerlessConfigFile() {
        const isTs = this.isTypeScript();
        const ext = isTs ? '.ts' : '.js';
        const stubName = isTs ? '/stubs/serverless.config.ts.stub' : '/stubs/serverless.config.stub';
        const fullPath = this.$app.configPath(`serverless${ext}`);
        await this.$file.put(fullPath, await this.$file.get(__dirname + stubName));

    }

}

export default ServerlessBootstrapCommand;
