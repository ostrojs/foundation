import path from 'node:path';
import GeneratorCommand from '@ostro/console/generatorCommand';
/**
 * Class EventMakeCommand.
 */
class EventMakeCommand extends GeneratorCommand {
    [key: string]: any;

    public declare $app: any;
    public declare $file: any;

    public get $signature(): string {
        return 'make:event';
    }

    public get $description(): string {
        return 'Create a new event class';
    }

    public $type: string = 'Event';

    public override get $dirname(): string {
        return __dirname;
    }

    /**
     * alreadyExists method.
     * @param rawName - Raw name
     * @returns Promise resolving to boolean
     */
    public alreadyExists(rawName: string): Promise<boolean> {
        return this.$file.exists(this.getPath(this.qualifyClass(rawName)));
    }

    /**
     * getStub method.
     * @returns Promise resolving to stub path
     */
    public getStub(): Promise<string> {
        return this.resolveStubPath('stubs/event.stub');
    }

    /**
     * getDefaultNamespace method.
     * @param rootNamespace - Root namespace
     * @returns The default namespace path
     */
    public getDefaultNamespace(rootNamespace: string): string {
        return path.join(rootNamespace, 'app', 'events');
    }
}

export default EventMakeCommand;