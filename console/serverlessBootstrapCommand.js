const Command = require('@ostro/console/command')
class ServerlessBootstrapCommand extends Command {

    $signature = 'serverless:bootstrap';

    $description = 'Bootstrap the serverless application';

    $options = [
        this.createOption('--force', 'The port to serve the application on')
    ];

    constructor($file) {
        super()
        this.$file = $file
    }
    getAppConfigFile() {
        return this.$app.basePath('config/app.js')
    }

    async handle() {
        const serverlessFile = this.$app.basePath("serverless.js");
        const force = this.option('force');
        const exists = await this.$file.exists(serverlessFile);

        if (exists && !force) {
            this.error('Serverless application already bootstrapped. Use --force to overwrite.');
            return;
        }

        try {
            await this.configureRootApp();
            await this.generateServerlessFile();
        } catch (error) {
            this.error(`Error during serverless bootstrap: ${error.message}`);
            return;
        }
        this.info('Serverless application bootstrapped successfully.');
    }
    async configureRootApp() {
        const rootApp = this.$app.basePath("app.js");
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
                /(server\.start\s*\(\s*\))/,
                "server.type('serverless');\n\n$1"
            );
        }

        // Add server.handler('serverless.handler') before server.start() if not present
        if (!/server\.handler\(['"]serverless\.handler['"]\)/.test(content)) {
            content = content.replace(
                /(server\.start\s*\(\s*\))/,
                "server.handler('serverless.handler');\n\n$1"
            );
        }

        // Remove server.register(kernel.handle()) if it exists
        content = content.replace(
            /^\s*server\.register\(\s*kernel\.handle\s*\(\s*\)\s*\)\s*;?\s*$/gm,
            ''
        );


        await this.$file.put(rootApp, content);

    }
    async generateServerlessFile() {
        const fullPath = this.$app.basePath("serverless.js");
        await this.$file.put(fullPath, await this.$file.get(__dirname + '/stubs/serverless.stub'));

    }

}

module.exports = ServerlessBootstrapCommand
