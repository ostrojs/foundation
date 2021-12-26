const GeneratorCommand = require('@ostro/console/generatorCommand')

class EventMakeCommand extends GeneratorCommand {

    $signature = 'make:event';

    $description = 'Create a new event class';

    $type = 'Event';

    alreadyExists($rawName) {
        return this.$file.exists(this.getPath(this.qualifyClass($rawName)));
    }

    getStub() {
        return this.resolveStubPath('/stubs/event.stub');
    }

    async resolveStubPath($stub) {
        let $customPath = this.$app.basePath(trim($stub, '/'))
        return await this.$file.exists($customPath) ?
            $customPath :
            __dirname + $stub;
    }

    getDefaultNamespace($rootNamespace) {
        return path.join($rootNamespace, 'app', 'events');
    }
}

module.exports = EventMakeCommand