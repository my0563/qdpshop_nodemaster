const Base = require('./base.js');

module.exports = class extends Base {
  async findcouponinfoByIdAction() {
    const id = this.post('id')
    const data = await this.model('coupon_main').where({ id: id }).find()
    return this.success(data)
  }

  async couponupdateAction() {
    const id = this.post('id')
    const coupon = this.post('coupon')
    const isWxcard = this.post('isWxcard')

    let updateData = { Instructions: coupon.Instructions }
    if (isWxcard == 1) {
      updateData.logo_url = coupon.logo_url
      updateData.color = coupon.color
    } else {
      updateData.coupon_name = coupon.name
      updateData.coupon_number = coupon.number
      updateData.coupon_value = coupon.value
      updateData.coupon_limit_value = coupon.limit_price
    }

    let card = await this.model('coupon_main').where({ id: id }).find()

    if (isWxcard == 1) {
      // TODO 更新微信卡券信息
      let wxdata = await this.service('wxcard', 'api').updateCard(card.coupon_id, card.coupon_type, coupon.logo_url, coupon.color, coupon.Instructions)
      if (wxdata.errcode == 0) {
        const data = await this.model('coupon_main').where({ id: id }).update(updateData)
        this.success(data)
      } else {
        console.log('微信卡券更新信息错误')
        this.fail()
      }
      think.logger.debug(`wx update data:`)
      think.logger.debug(wxdata)
    } else {
      const data = await this.model('coupon_main').where({ id: id }).update(updateData)
      this.success(data)
    }
  }

  /**
   * index action
   * @return {Promise} []
   */
  async indexAction() {
    const page = this.get('page') || 1;
    const size = this.get('size') || 10;
    const couponname = this.get('couponname') || '';
    // const consignee = this.get('consignee') || '';
    // console.log(couponname);
    const model = this.model('coupon_main');
    const data = await model.where({ coupon_name: ['like', `%${couponname}%`] }).order(['id DESC']).page(page, size).countSelect();
    // console.log(data);
    // const newList = [];
    // for (const item of data.data) {
    //   item.order_status_text = await this.model('order').getOrderStatusText(item.id);
    //   newList.push(item);
    // }
    // data.data = newList;
    return this.success(data);
  }

  /**
   * index action  添加指定商品享受优惠券 选择指定商品界面
   * @return {Promise} []
   */
  async pointgoodsAction() {
    const page = this.get('page') || 1;
    const size = this.get('size') || 5;
    const goodsname = this.get('goodsname') || '';
    // const consignee = this.get('consignee') || '';

    const model = this.model('goods');
    const data = await model.where({ name: ['like', `%${goodsname}%`] }).order(['id DESC']).page(page, size).countSelect();
    return this.success(data);
  }
  /**
   * index action  按商品id查找商品
   * @return {Promise} []
   */
  async findpointgoodsAction() {
    const id = this.post('id');
    const model = this.model('goods');
    console.log(id);
    let datalist = []
    for (var i = 0; i < id.length; i++) {
      // array[i]
      let obj = {}
      const data = await model.where({ id: id[i] }).order(['id DESC']).find();
      obj = data
      datalist.push(obj)
    }
    return this.success(datalist);
  }
  /**
   * index action  按用户id查找用户
   * @return {Promise} []
   */
  async findpointuserAction() {
    const id = this.post('id');
    const model = this.model('user');
    console.log(id);
    let datalist = []
    for (var i = 0; i < id.length; i++) {
      // array[i]
      let obj = {}
      const data = await model.where({ id: id[i] }).order(['id DESC']).find();
      obj = data
      datalist.push(obj)
    }
    return this.success(datalist);
    // }
    // const data = await model.where({ id: id}).order(['id DESC']).select();
    // return this.success(data);
  }

  /**
   * index action  添加指定用户享受优惠券 选择指定用户界面
   * @return {Promise} []
   */
  async pointuserAction() {
    const page = this.get('page') || 1;
    const size = this.get('size') || 5;
    const username = this.get('username') || '';
    // const consignee = this.get('consignee') || '';

    const model = this.model('user');
    const data = await model.where({ nickname: ['like', `%${username}%`] }).order(['id DESC']).page(page, size).countSelect();
    return this.success(data);
  }

  /**
   * index action 修改优惠券启用信息
   * @return {Promise} []
   */
  async setcupableAction() {
    const id = this.post('id');
    const is_able = this.post('data');
    const model = this.model('coupon_main');
    const card = await model.where({ coupon_id: id }).find()
    const isWxcard = card.isWxcard;
    if (isWxcard == 1) {
      if (is_able == 1) return this.fail()

      let service = this.service('wxcard', 'api')
      const wxdata = await service.deleteCard(id)
      think.logger.debug(wxdata)
      if (wxdata.errcode != 0) return this.fail()
    }
    const data = await model.where({ coupon_id: id }).update({
      coupon_isabled: is_able
    });
    return this.success({
      id: id,
      data: data
    });
  }

  /**
   * 数据库添加优惠券主表数据
   * @return {Promise} []
   */
  async storemainCupAction() {
    const ruleForm = this.post('ruleForm');
    const CupTime = this.post('CupTime');
    const CupState = this.post('CupState');
    const GoodsList = this.post('GoodsList');
    const UserList = this.post('UserList');
    const isWxcard = this.post('isWxcard');

    const couponId = Math.random().toString(36).substr(2).toLocaleUpperCase();
    // console.log(couponId);

    let goodsitemKey = 0;
    let goodsCupitem = [];
    for (const goodsItem of GoodsList) {
      goodsCupitem.push(goodsItem.id)
      goodsitemKey += 1;
    }
    // console.log(goodsCupitem);
    const goodsCup = goodsCupitem.join(',')
    //
    let useritemKey = 0;
    let userCupitem = [];
    for (const userItem of UserList) {
      userCupitem.push(userItem.id)
      useritemKey += 1;
    }
    // console.log(userCupitem);
    const userCup = userCupitem.join(',')
    // if (userCupitem.length > 0) {
    //   for (var i = 0; i < userCupitem.length; i++) {
    //     console.log(userCupitem[i]);
    // await this.model('coupon_user').add({
    //   user_id:userCupitem[i],
    //   coupon_id:couponId,
    //   coupon_name:ruleForm.name,
    //   coupon_number:ruleForm.number,
    //   coupon_type:CupState.CupFrom,
    //   coupon_value:ruleForm.value,
    //   coupon_limit:CupState.CupLimit,
    //   coupon_limit_value:ruleForm.limit_price,
    //   coupon_user_getnumber:ruleForm.user_number,
    //   validity_type:CupState.CupTime,
    //   validity_create:CupTime.create,
    //   validity_start:CupTime.start,
    //   validity_end:CupTime.end,
    //   point_goods:goodsCup,
    //   point_user:userCup,
    //   Instructions:ruleForm.Instructions,
    // })
    // }
    // }
    //

    let card = {
      logo_url: ruleForm.logo_url,
      coupon_name: ruleForm.name,
      // title: ruleForm.title,
      // sub_title: ruleForm.sub_title,
      color: ruleForm.color,
      coupon_id: couponId,
      coupon_isabled: CupState.CupAble,
      coupon_number: ruleForm.number,
      coupon_type: CupState.CupFrom,
      coupon_value: ruleForm.value,
      coupon_limit: CupState.CupLimit,
      coupon_limit_value: ruleForm.limit_price,
      coupon_user_getnumber: ruleForm.user_number,
      validity_type: CupState.CupTime,
      validity_create: CupTime.create,
      validity_start: CupTime.start,
      validity_end: CupTime.end,
      validity_limit_day: CupTime.limit_day,
      point_goods: goodsCup,
      point_user: userCup,
      Instructions: ruleForm.Instructions,
      isWxcard: isWxcard
    }

    if (isWxcard == 1) {
      let wxcarddata = await this.service('wxcard', 'api').createCard(card.coupon_type, card.logo_url,
        card.coupon_name, card.color, card.Instructions, card.coupon_number, card.validity_type,
        card.validity_start, card.validity_end, card.validity_limit_day, card.coupon_value, card.coupon_limit_value);
      
      think.logger.debug(wxcarddata)
      if (wxcarddata.errcode == 0) {
        card.coupon_id = wxcarddata.card_id
        const data = await this.model('coupon_main').add(card)
        this.success()
      } else {
        this.fail()
      }
    } else {
      const data = await this.model('coupon_main').add(card)
      this.success()
    }

    // console.log(data);
    // return this.success({
    //   ruleForm:ruleForm,
    //   CupTime:CupTime,
    //   CupState:CupState,
    //   GoodsList:GoodsList,
    //   UserList:UserList,
    //
    // });
  }

  async infoAction() {
    const id = this.post('id');
    const model = this.model('order');
    const data = await model.where({ id: id }).find();

    return this.success(data);
  }

  async delcupAction() {
    const id = this.post('id');
    await this.model('coupon_main').where({ coupon_id: id }).limit(1).delete();
    await this.service('wxcard', 'api').deleteCard(id);
    // 删除订单商品
    // await this.model('order_goods').where({order_id: id}).delete();

    // TODO 事务，验证订单是否可删除（只有失效的订单才可以删除）

    return this.success();
  }
};
