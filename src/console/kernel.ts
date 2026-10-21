import fs from 'fs-extra';
import path from 'path';
import KernelContract from '@ostro/contracts/console/kernel';
import Assistant from '@ostro/console/application';

/**
 * Class Kernel.
 */
class Kernel extends KernelContract {
    [key: string]: any;

    $commandsLoaded = false;

    bootstrappers = [
            '@ostro/foundation/bootstrap/loadEnvironmentVariables',
            '@ostro/foundation/bootstrap/loadConfiguration',
            '@ostro/foundation/bootstrap/registerFacades',
            '@ostro/foundation/bootstrap/registerProviders',
            '@ostro/foundation/bootstrap/bootProviders',
    ];

    $commands =  {};

    /**
     * Create a new instance.
     */
    constructor() {
        super()

        this.bootstrap();

    }

    /**
     * bootstrap method.
     * @returns {any}
     */
    public bootstrap() {
        if (!this.$app.hasBeenBootstrapped()) {
            this.$app.bootstrapWith(this.getBootstrappers());
        }
        this.$app.loadDeferredProviders();
        if (!this.$commandsLoaded) {
            this.commands();
            this.$commandsLoaded = true;
        }
    }

    /**
     * callCommand method.
     * @param {*} $command
     * @param {*} $parameters
     * @param {*} $outputBuffer
     * @returns {any}
     */
    public callCommand($command: any, $parameters: any[] = [], $outputBuffer: any = null) {
        
        this.bootstrap();

        return this.getAssistant().call($command, $parameters, $outputBuffer);
    }

    /**
     * getAssistant method.
     * @returns {any}
     */
    public getAssistant() {
        if (!this.assistant) {
            return this.assistant = (new (Assistant as any)(this.$app, this.$app.version()))
                .resolveCommands(this.$commands);
        }

        return this.assistant;
    }

    /**
     * getBootstrappers method.
     * @returns {any}
     */
    public getBootstrappers() {
        return this.bootstrappers;
    }

    /**
     * schedule method.
     * @param {*} $schedule
     * @returns {any}
     */
    public schedule($schedule: any) {

    }

    /**
     * handle method.
     * @async
     * @param {*} $input
     * @param {*} $output
     * @returns {any}
     */
    override async handle($input: any, $output: any = null): Promise<any> {
        try {
            await this.getAssistant().run($input, $output);
        } catch ($e) {
            this.reportException($e);

            this.renderException($e);
        } finally {
            process.exit(this.getAssistant().getAutoExit())

        }
    }

    /**
     * load method.
     * @param {*} $paths
     * @returns {any}
     */
    public load($paths: any) {
        if (typeof $paths == 'string') {
            $paths = path.resolve($paths)
            if (fs.existsSync($paths)) {
                let state = fs.lstatSync($paths)
                if (state.isFile()) {
                    return this.load(require($paths))
                } else {
                    return this.load(fs.readdirSync($paths).map(filename => this.load(path.resolve($paths, filename))));
                }
            }
        } else if ($paths instanceof Array) {
            return $paths.map(file => this.load(file))
        }
        if (typeof $paths == 'function') {
            Assistant.addBootstraper(function($assistant) {
                $assistant.resolve($paths)
            })
        }
    }

    /**
     * reportException method.
     * @param {*} $e
     * @returns {any}
     */
    public reportException($e: any) {
        this.$app['@ostro/contracts/exception/handler'].report($e);

    }

    /**
     * renderException method.
     * @param {*} $e
     * @returns {any}
     */
    public renderException($e: any) {
        this.$app['@ostro/contracts/exception/handler'].renderForConsole($e);
    }

    /**
     * commands method.
     * @returns {any}
     */
    public commands() {
        this.load(__dirname + '/commands');
    }

}

export default Kernel;