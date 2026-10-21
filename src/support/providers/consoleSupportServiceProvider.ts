import AggregateServiceProvider from '@ostro/support/aggregateServiceProvider';
import DeferrableProvider from '@ostro/support/deferrableProvider';
import { implement } from '@ostro/support/function';

/**
 * Class ConsoleSupportServiceProvider.
 */
class ConsoleSupportServiceProvider extends (implement(AggregateServiceProvider, DeferrableProvider) as any) {

    public $providers: string[] = [
        '@ostro/foundation/providers/assistantServiceProvider',
        '@ostro/database/migrationServiceProvider'
    ];
}

export default ConsoleSupportServiceProvider;