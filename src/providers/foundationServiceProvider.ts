import AggregateServiceProvider from '@ostro/support/aggregateServiceProvider';
import Http from '@ostro/http/httpContext';
import Request from '@ostro/http/request';
import FileRequest from '@ostro/http/file';

/**
 * Class FoundationServiceProvider.
 */
class FoundationServiceProvider extends AggregateServiceProvider {

    /**
     * register method.
     */
    public override register(): void {
        super.register();

        this.registerRequestValidation();
    }

    /**
     * boot method.
     */
    public override boot(): void {
        super.boot();
        this.requestFilesystem();
    }

    /**
     * registerRequestValidation method.
     */
    public registerRequestValidation(): void {
        const $app = this.$app;

        Request.macro('validate', function(this: any, $rules: any = {}, $message: any = {}) {
            return $app['validation'].validate(this.all(), $rules, $message);
        });
    }

    /**
     * requestFilesystem method.
     */
    public requestFilesystem(): void {
        this.$app.whenHas('filesystem', function(filesystem: any) {
            filesystem.registerToRequest(FileRequest);
        });
    }
}

export default FoundationServiceProvider;