const Command = require('@ostro/console/command')
const EventServiceProvider = require('@ostro/event/eventServiceProvider')
class EventGenerateCommand extends Command {

    get $signature() {
        return 'event:generate'
    };

    get $description() {
        return 'Generate the missing events and listeners based on registration';
    }

    async handle() {

        this.info('Events and listeners generated successfully!');
    }

    makeEventAndListeners($event, $listeners) {
        if (!$event.includes('\\')) {
            return;
        }

        this.callSilent('make:event', { 'name': $event });

        this.makeListeners($event, $listeners);
    }

    makeListeners($event, $listeners) {
        for (let $listener of $listeners) {
            $listener = $listener.replace('/@.+$/', '');

            this.callSilent('make:listener', Object.filter({ 'name': $listener, '--event': $event }));
        }
    }
}

module.exports = EventGenerateCommand