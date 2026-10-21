declare var base_path: any, is_null: any, isSymbolicLink: any, public_path: any, storage_path: any;
import Command from '@ostro/console/command';

/**
 * Class ServeCommand.
 */
class ServeCommand extends Command {
    [key: string]: any;

    $portOffset = 0;

    public get $signature(): string {
        return 'serve';
    }

    public get $description(): string {
        return 'Serve the application on the nodejs development server';
    }

    public get $options(): any[] {
        return [
        this.createOption('--host <host> ', 'The host address to serve the application on').default('127.1.0.0', 'localhost ip'),
        this.createOption('--port [port] ', 'The port to serve the application on').default(8000, 'Recomanded port'),
        this.createOption('--tries [tries] ', 'The max number of ports to attempt to serve from'),
        this.createOption('--no-reload [no-reload] ', 'Do not reload the development server on .env file changes'),
    ];
    }

    /**
     * Create a new instance.
     * @param {*} server
     * @param {*} file
     */
    constructor(server: any, file: any) {
        super()
        this.$server = server
        this.$file = file
    }

    /**
     * handle method.
     * @async
     * @returns {any}
     */
    public async handle() {
        this.line(`<info>Starting Ostro development server:</info> http://${this.host()}:${this.port()}`);

        process.env.PORT = this.port()
        process.env.HOST = this.host()

        this.requireServerFile(this.serverStarterPath());

    }

    /**
     * serverStarterPath method.
     * @returns {any}
     */
    public serverStarterPath() {
        return base_path('app.js')
    }

    /**
     * requireServerFile method.
     * @param {*} $path
     * @returns {any}
     */
    public requireServerFile($path: string) {
        return require($path)
    }

    /**
     * host method.
     * @returns {any}
     */
    public host() {
        return this.input.getOption('host');
    }

    /**
     * port method.
     * @returns {any}
     */
    public port() {
        let $port = this.input.getOption('port')

        return $port + this.$portOffset;
    }

    /**
     * canTryAnotherPort method.
     * @returns {any}
     */
    public canTryAnotherPort() {
        return is_null(this.input.getOption('port')) && (this.input.getOption('tries') > this.$portOffset);
    }

}

export default ServeCommand;