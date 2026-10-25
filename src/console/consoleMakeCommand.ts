import path from 'node:path';
import GeneratorCommand from '@ostro/console/generatorCommand';
import * as StringHelper from '@ostro/support/string';
/**
 * Class FactoryMakeCommand.
 */
class FactoryMakeCommand extends GeneratorCommand {
    [key: string]: any;

    public declare $app: any;
    public declare $file: any;

    public override get $dirname(): string {
        return __dirname;
    }

    public get $signature(): string {
        return 'make:command';
    }

    public get $description(): string {
        return 'Create a new Assistant command';
    }

    public get $options(): any[] {
        return [
        this.createOption('--command [command] ', 'The terminal command that should be assigned'),
    ];
    }

    public get $arguments(): any[] {
        return [
        this.createArgument('[name]', 'The name of the command').required()
    ];
    }

    public $type: string = 'Console command';

    /**
     * replaceClass method.
     * @param stub - The stub content
     * @param name - The command name
     * @returns The updated stub content
     */
    public replaceClass(stub: string, name: string): string {
        name = StringHelper.replaceAll(name, ':', ' ');
        stub = super.replaceClass(stub, name);
        let command: string = this.option('command') || this.argument('name');
        return StringHelper.replaceAll(stub, ['dummy:command', '{{ command }}'], command);
    }

    /**
     * getStub method.
     * @returns Stub path
     */
    public getStub(): Promise<string> {
        return this.resolveStubPath('stubs/console.stub');
    }

    /**
     * getDefaultNamespace method.
     * @param rootNamespace - The root namespace path
     * @returns The default namespace path
     */
    public getDefaultNamespace(rootNamespace: string): string {
        return path.join(rootNamespace, 'app', 'console', 'commands');
    }

}

export default FactoryMakeCommand;