import Command from '@ostro/console/command';
/**
 * Class ServerlessBootstrapCommand.
 */
class ServerlessBootstrapCommand extends Command {
    [key: string]: any;

    public get $signature(): string {
        return 'server:bootstrap';
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
        if (await this.$file.exists(serverlessFile)) {
            if (!this.option('force')) {
                this.error('Serverless is already active. Use --force to overwrite.');
                return;
            }
        }
        try {
            await this.configureRootApp();
            // await this.removeServerlessFile();
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

        // Replace server.type('serverless') with server.type('server')
        if (!/server\.type\(['"]server['"]\)/.test(content)) {
            content = content.replace(
                /server\.type\(['"]serverless['"]\);?/g,
                "server.type('server');"
            );
        }



        // Remove server.handler('serverless.handler')
        content = content.replace(
            /^\s*server\.handler\(['"]serverless\.handler['"]\);?\s*$/gm,
            ''
        );

        // Add server.register(kernel.handle()) before server.start() if not present
        if (!/server\.register\(\s*kernel\.handle\(/.test(content)) {
            const registerCall = ext === '.ts' ? "server.register(kernel.handle({}));\n\n$1" : "server.register(kernel.handle());\n\n$1";
            content = content.replace(
                /(server\.start\s*\(\s*)/,
                registerCall
            );
        }

        await this.$file.put(rootApp, content);
    }
    /**
     * removeServerlessFile method.
     * @async
     * @returns {any}
     */
    public async removeServerlessFile() {
        const ext = this.isTypeScript() ? '.ts' : '.js';
        const fullPath = this.$app.basePath(`serverless${ext}`);
        await this.$file.delete(fullPath);

    }

}

export default ServerlessBootstrapCommand;
