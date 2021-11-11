const Authenticatable = require('@ostro/auth/authenticatable');
const Model = require('@ostro/database/eloquent/model')
const Crypt = require('@ostro/support/facades/crypt')
class User extends implement(Model, Authenticatable) {

	async createToken(){
		let token = Crypt.encrypt(this.getAttribute(this.getKeyName())+Date.now())
		this.setApiToken(token)
		await this.save()
		return {accessToken:token}
	}
}

module.exports = User