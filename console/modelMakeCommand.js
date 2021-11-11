const GeneratorCommand = require('@ostro/console/generatorCommand')

class ModelMakeCommand extends GeneratorCommand {

    get $signature() {
        return 'make:model';
    }

    get $description() {
        return 'Create a new Eloquent model class'
    };

    get $options() {
        return [
            this.createOption('-a, --all', 'Generate a migration, seeder, factory, and resource controller for the model'),
            this.createOption('-c, --controller', 'Create a new controller for the model'),
            this.createOption('-f, --factory', 'Create a new factory for the model'),
            this.createOption('--force', 'Create the class even if the model already exists'),
            this.createOption('-m, --migration', 'Create a new migration file for the model'),
            this.createOption('-s, --seed', 'Create a new seeder file for the model'),
            this.createOption('-p, --pivot', 'Indicates if the generated model should be a custom intermediate table model'),
            this.createOption('-r, --resource', 'Indicates if the generated controller should be a resource controller'),
            this.createOption('--api', 'Indicates if the generated controller should be an API controller'),

        ]
    }

    get $type() {
        return 'Model';
    }

    get $dirname() {
        return __dirname
    }

    async handle() {

        if (await super.handle() === false && !this.option('force')) {
            return false;
        }

        if (this.option('all')) {
            this.input.setOption('factory', true);
            this.input.setOption('seed', true);
            this.input.setOption('migration', true);
            this.input.setOption('controller', true);
            this.input.setOption('resource', true);
        }

        if (this.option('factory')) {
            await this.createFactory();
        }

        if (this.option('migration')) {
            await this.createMigration();
        }

        if (this.option('seed')) {
            await this.createSeeder();
        }

        if (this.option('controller') || this.option('resource') || this.option('api')) {
            await this.createController();
        }
    }

    createFactory() {
        let $factory = this.argument('name');
        return this.callCommand('make:factory', {
            'name': `${$factory}Factory`,
            '--model': this.qualifyClass(this.getNameInput()),
        });
    }

    createMigration() {
        let $table = this.getFileName(this.argument('name')).plural().camelCase().snakeCase();

        return this.callCommand('make:migration', {
            'name': `create_${$table}_table`,
            '--create': $table,
            '--relativepath': this.getNamespace(this.argument('name')),
        });
    }

    createSeeder() {
        let $seeder = this.argument('name');

        return this.callCommand('make:seeder', {
            'name': `${$seeder}Seeder`,
        });
    }

    createController() {
        let $controller = this.argument('name');

        let $modelName = this.qualifyClass(this.getNameInput());

        return this.callCommand('make:controller', Object.filter({
            'name': `${$controller}Controller`,
            '--model': this.option('resource') ? $modelName : null,
        }));
    }

    getStub() {
        return this.resolveStubPath('/stubs/model.stub');
    }

    getDefaultNamespace($rootNamespace) {
        return $rootNamespace.includes('.js') ? $rootNamespace : path.resolve($rootNamespace, app_path('models'));
    }

    resolveStubPath($stub) {
        let $customPath = this.$app.basePath(trim($stub, '/'))
        return this.$file.exists($customPath).then($exists => ($exists ? $customPath : path.join(__dirname, $stub)))
    }

}
module.exports = ModelMakeCommand