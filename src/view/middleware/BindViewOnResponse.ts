import View from '../viewEngine';

/**
 * Class BindView.
 */
class BindView {
    public declare $app: any;

    /**
     * handle method.
     * @param http - Http context
     * @param next - Next middleware callback
     */
    public handle(http: any, next: Function): void {
        http.response.view = new (View as any)(this.$app, http, next);
        next();
    }
}

export default BindView;