import Authenticatable from '@ostro/auth/authenticatable';
import Model from '@ostro/database/eloquent/model';
import Crypt from '@ostro/support/facades/crypt';
import { implement } from '@ostro/support/function';

/**
 * Class User.
 */
class User extends implement(Model, Authenticatable) {

    /**
     * createToken method.
     * @returns Access token object
     */
    public async createToken(): Promise<{ accessToken: string }> {
        const token: string = Crypt.encrypt(String(this.getAttribute(this.getKeyName())) + Date.now());
        this.setApiToken(token);
        await this.save();
        return { accessToken: token };
    }
}

export default User;