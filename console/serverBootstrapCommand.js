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
            await this.removeServerlessFile();
        } catch (error) {
            this.error(`Error during serverless bootstrap: ${error.message}`);
            return;
        }
        this.info('Serverless application bootstrapped successfully.');
    }
    async configureRootApp() {
        const rootApp = this.$app.basePath("app.js");
        let content = await this.$file.get(rootApp);
        content = content.replace(
            /require\(['"]\.\/serverless['"]\)/g,
            "app.make('@ostro/contracts/http/kernel')"
        );
        // Ensure server.type('serverless') is present before server.start()
        // Remove any occurrence of server.type('serverless')
        content = content.replace(/server\.type\(['"]serverless['"]\);\s*/g, '');

        await this.$file.put(rootApp, content);

    }
    async removeServerlessFile() {
        const fullPath = this.$app.basePath("serverless.js");
        await this.$file.delete(fullPath);

    }

}

module.exports = ServerlessBootstrapCommand