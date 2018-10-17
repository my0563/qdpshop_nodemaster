const Base = require('./base');

module.exports = class extends Base {
  async indexAction () {
    const model = this.model('stylist');
    const data = await model.where({}).select();

    return this.success(data);
  }

  async listAction() {
    const model = this.model('stylist');
    const data = await model.where({}).select();

    return this.success(data);
  }

  async detailAction() {
    const id = this.get('id');
    const model = this.model('stylist');
    const data = await model.where({id: id}).find();
  
    return this.success(data);
  }

  async getidAction() {
    const user_id = this.get('user_id')
    let userInfo = await this.model('user').where({id: user_id}).find();
    this.success(userInfo.stylist_id)
  }
}