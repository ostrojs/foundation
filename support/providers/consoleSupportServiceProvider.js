const AggregateServiceProvider = require('@ostro/support/aggregateServiceProvider')
const DeferrableProvider = require('@ostro/support/deferrableProvider')
class ConsoleSupportServiceProvider extends implement(AggregateServiceProvider, DeferrableProvider) {

    $providers = [
        '@ostro/foundation/providers/assistantServiceProvider',
        '@ostro/database/migrationServiceProvider'
    ];
}
module.exports = ConsoleSupportServiceProvider