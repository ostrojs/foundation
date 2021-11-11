const Command = require('@ostro/console/command')

class ServeCommand extends Command {

    get $portOffset() {
        return 0
    };

    get $signature() {
        return 'serve';
    }

    get $description() {
        return 'Serve the application on the nodejs development server'
    };

    get $options() {
        return [
            this.createOption('--host <host> ', 'The host address to serve the application on').default('127.1.0.0', 'localhost ip'),
            this.createOption('--port [port] ', 'The port to serve the application on').default(8000, 'Recomanded port'),
            this.createOption('--tries [tries] ', 'The max number of ports to attempt to serve from'),
            this.createOption('--no-reload [no-reload] ', 'Do not reload the development server on .env file changes'),
        ]
    }

    constructor(server, file) {
        super()
        this.$server = server
        this.$file = file
    }

    async handle() {
        this.line(`<info>Starting Ostro development server:</info> http://${this.host()}:${this.port()}`);

        process.env.PORT = this.port()
        process.env.HOST = this.host()

        this.requireServerFile(this.serverStarterPath());

    }

    serverStarterPath() {
        return base_path('app.js')
    }

    requireServerFile($path) {
        return require($path)
    }

    host() {
        return this.input.getOption('host');
    }

    port() {
        let $port = this.input.getOption('port')

        return $port + this.$portOffset;
    }

    canTryAnotherPort() {
        return is_null(this.input.getOption('port')) && (this.input.getOption('tries') > this.$portOffset);
    }

}

module.exports = ServeCommand