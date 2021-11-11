const fs = require('fs-extra')
const path = require('path')
const KernelContract = require('@ostro/contracts/console/kernel')
const Assistant = require('@ostro/console/application')
const kCommandLoaded = Symbol('commandsLoaded')
class Kernel extends KernelContract {
    get $commandsLoaded() {
        return this[kCommandLoaded] = this[kCommandLoaded] || false
    }

    set $commandsLoaded(value) {
        return this[kCommandLoaded] = value
    }

    get bootstrappers() {
        return [
            '@ostro/foundation/bootstrap/loadEnvironmentVariables',
            '@ostro/foundation/bootstrap/loadConfiguration',
            '@ostro/foundation/bootstrap/registerFacades',
            '@ostro/foundation/bootstrap/registerProviders',
            '@ostro/foundation/bootstrap/bootProviders',
        ];
    }

    get $commands() {
        return {}
    }

    constructor() {
        super()

        this.bootstrap();

    }

    bootstrap() {
        if (!this.$app.hasBeenBootstrapped()) {
            this.$app.bootstrapWith(this.getBootstrappers());
        }
        this.$app.loadDeferredProviders();
        if (!this.$commandsLoaded) {
            this.commands();
            this.$commandsLoaded = true;
        }
    }

    getAssistant() {
        if (!this.assistant) {
            return this.assistant = (new Assistant(this.$app, this.$app.version()))
                .resolveCommands(this.$commands);
        }

        return this.assistant;
    }

    getBootstrappers() {
        return this.bootstrappers;
    }

    schedule($schedule) {

    }

    async handle($input, $output = null) {
        try {
            await this.getAssistant().run($input, $output);
        } catch ($e) {
            this.reportException($e);

            this.renderException($e);
        } finally {
            process.exit(this.getAssistant().getAutoExit())

        }
    }

    load($paths) {
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

    reportException($e) {
        this.$app['@ostro/contracts/exception/handler'].report($e);

    }

    renderException($e) {
        this.$app['@ostro/contracts/exception/handler'].renderForConsole($e);
    }

    commands() {
        this.load(__dirname + '/commands');
    }

}
module.exports = Kernel