const GeneratorCommand = require('@ostro/console/generatorCommand')

class ResourceMakeCommand extends GeneratorCommand {

    $signature = 'make:resource';

    $description = 'Create a new resource';

    $type = 'Resource';

    $options = [
        this.createOption('-c, --collection', 'Create a resource collection')
    ];

    async handle() {
        if (this.collection()) {
            this.$type = 'Resource collection';
        }

        await super.handle();
    }

    getStub() {
        return this.collection() ?
            this.resolveStubPath('/stubs/resource-collection.stub') :
            this.resolveStubPath('/stubs/resource.stub');
    }

    collection() {
        return this.option('collection') ||
            String.endsWith(this.argument('name'), 'Collection');
    }

    async resolveStubPath($stub) {
        let $customPath = this.$app.basePath(trim($stub, path.sep))
        return await this.$file.exists($customPath) ?
            $customPath :
            __dirname + $stub;
    }

    getDefaultNamespace($rootNamespace) {
        return path.join($rootNamespace, 'app', 'http', 'resources');
    }

}
module.exports = ResourceMakeCommand