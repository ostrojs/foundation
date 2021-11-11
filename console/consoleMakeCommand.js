const GeneratorCommand = require('@ostro/console/generatorCommand')

class FactoryMakeCommand extends GeneratorCommand {

    get $signature() {
        return 'make:command';
    }

    get $description() {
        return 'Create a new Assistant command'
    };

    get $options() {
        return [
            this.createOption('--command [command] ', 'The terminal command that should be assigned'),
        ]
    }

    get $arguments() {
        return [
            this.createArgument('[name]', 'The name of the command').required()
        ]
    }

    get $type() {
        return 'Console command'
    }

    replaceClass($stub, $name) {
        $stub = super.replaceClass($stub, $name);
        return $stub.replaceAll(['dummy:command', '{{ command }}'], this.option('command'));
    }

    getStub() {
        return this.resolveStubPath('/stubs/console.stub');
    }

    resolveStubPath($stub) {
        let $customPath = this.$app.basePath(trim($stub, '/'))
        return this.$file.exists($customPath).then($exists => ($exists ? $customPath : path.join(__dirname, $stub)))
    }

    getDefaultNamespace($rootNamespace) {
        return path.join($rootNamespace, 'app', 'console', 'commands');
    }

}

module.exports = FactoryMakeCommand