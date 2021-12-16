const GeneratorCommand = require('@ostro/console/generatorCommand')

class FactoryMakeCommand extends GeneratorCommand {

    $signature = 'make:command';

    $description =  'Create a new Assistant command';

    $options = [
        this.createOption('--command [command] ', 'The terminal command that should be assigned'),
    ];

    $arguments =  [
        this.createArgument('[name]', 'The name of the command').required()
    ];

    $type = 'Console command';

    replaceClass($stub, $name) {
        $name = $name.replaceAll(':',' ')
        $stub = super.replaceClass($stub, $name);
        let $command = this.option('command') || this.argument('name')
        return $stub.replaceAll(['dummy:command', '{{ command }}'], $command);
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