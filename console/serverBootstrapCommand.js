const Command = require('@ostro/console/command')
class ServerlessBootstrapCommand extends Command {

    $signature = 'server:bootstrap';

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
        const serverlessFile = this.$app.basePath('serverless.js');
        if (await this.$file.exists(serverlessFile)) {
            if (!this.option('force')) {
                this.error('Serverless is already active. Use --force to overwrite.');
                return;
            }
        }
        try {
            await this.configureRootApp();
            // await this.removeServerlessFile();
        } catch (error) {
            this.error(`Error during serverless bootstrap: ${error.message}`);
            return;
        }
        this.info('Serverless application bootstrapped successfully.');
    }
    async configureRootApp() {
        const rootApp = this.$app.basePath("app.js");
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
        if (!/server\.register\(\s*kernel\.handle\(\)\s*\)/.test(content)) {
            content = content.replace(
                /(server\.start\s*\(\s*)/,
                "server.register(kernel.handle());\n\n$1"
            );
        }

        await this.$file.put(rootApp, content);
    }
    async removeServerlessFile() {
        const fullPath = this.$app.basePath("serverless.js");
        await this.$file.delete(fullPath);

    }

}

module.exports = ServerlessBootstrapCommand
