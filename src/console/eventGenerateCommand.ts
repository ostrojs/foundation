import Command from '@ostro/console/command';
import '@ostro/support/object';
const EventServiceProvider: any = null;

/**
 * Class EventGenerateCommand.
 */
class EventGenerateCommand extends Command {
    [key: string]: any;

    public get $signature(): string {
        return 'event:generate';
    }

    public get $description(): string {
        return 'Generate the missing events and listeners based on registration';
    }

    /**
     * handle method.
     * @returns Promise resolving when done
     */
    public async handle(): Promise<void> {
        this.info('Events and listeners generated successfully!');
    }

    /**
     * makeEventAndListeners method.
     * @param event - The event class name
     * @param listeners - Array of listener class names
     */
    public makeEventAndListeners(event: string, listeners: any[]): void {
        if (!event.includes('\\')) {
            return;
        }

        this.callSilent('make:event', { 'name': event });

        this.makeListeners(event, listeners);
    }

    /**
     * makeListeners method.
     * @param event - The event class name
     * @param listeners - Array of listener class names
     */
    public makeListeners(event: string, listeners: any[]): void {
        for (let listener of listeners) {
            listener = listener.replace(/@.+$/, '');

            this.callSilent('make:listener', Object.filter({ 'name': listener, '--event': event }));
        }
    }
}

export default EventGenerateCommand;