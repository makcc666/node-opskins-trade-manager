/* Errors */
const Type = require('../errors/type.js')
const Missing = require('../errors/missing.js')
const Invalid = require('../errors/invalid.js')

/* Classes */
const Offer = require('./offer.js')
const Item = require('./item.js')
const User = require('./user.js')

class ITrade {
  constructor(manager) {
    this.manager = manager

    this.ITrade = this.manager.api.ITrade
  }

  _convertItems(items) {
    for(let i = 0; i < items.length; i++) {
      if(typeof items[i] == 'number') continue
      if(typeof items[i] == 'string') {
        const match = items[i].match(/[0-9]{1,}/)
        items[i] = match ? match[0] : ''
        continue
      }
      if(items[i] instanceof Item) {
        items[i] = items[i].id
        continue
      }
    }

    return items.toString()
  }

  async GetApps() {
    const res = await this.ITrade.GetApps()

    return res.response.apps
  }

  async GetOffer(params = {}) {
    if(params instanceof Offer) params = { offer_id: params.id }
    if(params.offer && params.offer instanceof Offer) {
      params.offer_id = params.offer.id
      delete params.offer
    }

    const res = await this.ITrade.GetOffer(params)

    return new Offer(this.manager, res.response.offer)
  }

  async GetOffers(params = {}) {
    if(Array.isArray(params) && params.every(el => { return el instanceof Offer })) {
      params = {
        ids: _.map(params, el => { return el.id }).toString()
      }
    }
    if(params.offers && Array.isArray(params.offers) && params.offers.every(el => { return el instanceof Offer })) {
      params.ids = _.map(params.offers, el => { return el.id }).toString()
      delete params.offers
    }

    const res = await this.ITrade.GetOffers(params)

    for(let i = 0; i < res.response.offers.length; i++) {
      res.response.offers[i] = new Offer(this.manager, res.response.offers[i])
    }

    return res.response.offers
  }

  async GetTradeURL(params = {}) {
    const res = await this.ITrade.GetTradeURL(params)

    return res.response
  }

  async GetUserInventory(params = {}) {
    if(params instanceof User) {
      if(!params.uid) throw new Missing('user.uid')
      params = { uid: params.uid, app_id: 1 }
    }
    if(params.user && params.user instanceof User) {
      if(!params.user.uid) throw new Missing('user.uid')
      params.uid = params.user.uid
      delete params.user
    }

    const res = await this.ITrade.GetUserInventory(params)

    for(let i = 0; i < res.response.items.length; i++) {
      res.response.items[i] = new Item(this.manager, res.response.items[i])
    }

    const { items, user_data } = res.response
    const user_object = {
      uid: params.uid,
      display_name: user_data.username,
      avatar: user_data.avatar
    }
    const user = new User(this.manager, user_object)

    return { items, user }
  }

  async GetUserInventoryFromSteamId(params = {}) {
    if(params instanceof User) {
      if(!params.steam_id) throw new Missing('user.steam_id')
      params = { steam_id: params.steam_id, app_id: 1 }
    }
    if(params.user && params.user instanceof User) {
      if(!params.user.steam_id) throw new Missing('user.steam_id')
      params.steam_id = params.user.steam_id
      delete params.user
    }

    const res = await this.ITrade.GetUserInventoryFromSteamId(params)

    for(let i = 0; i < res.response.items.length; i++) {
      res.response.items[i] = new Item(this.manager, res.response.items[i])
    }

    const { items, user_data } = res.response
    const user_object = {
      steam_id: params.steam_id,
      display_name: user_data.username,
      avatar: user_data.avatar
    }
    const user = new User(this.manager, user_object)

    return { items, user }
  }

  async RegenerateTradeURL() {
    const res = await this.ITrade.RegenerateTradeURL()

    return res.response
  }

  async SendOffer(params = {}) {
    if(params.tradeurl && !params.tradeurl.match(/^((https:\/\/trade\.opskins\.com\/t\/([0-9]{1,})\/([a-zA-Z0-9]{8}))|(https:\/\/trade\.opskins\.com\/trade\/userid\/([0-9]{1,})\/token\/([a-zA-Z0-9]{8})))$/)) {
      throw new Invalid('tradeurl')
    }
    if(params.tradeurl) {
      const tradeurl = params.tradeurl.replace('https://trade.opskins.com/t/', '').replace('https://trade.opskins.com/trade/userid/', '').replace('token/', '').split('/')
      params.uid = tradeurl[0]
      params.token = tradeurl[1]
    }
    if (!params.uid) throw new Missing('uid')
    if (!params.token) throw new Missing('token')
    if (!params.items && !params.items_to_receive && !params.items_to_send) throw new Missing('items')

    let { uid, token, items, twofactor_code, message = '' } = params

    if (items !== undefined) items = items instanceof Item ? items.id.toString() : (Array.isArray(items) ? this._convertItems(items) : items.toString())
    if (items_to_receive !== undefined) items_to_receive = items_to_receive instanceof Item ? items_to_receive.id.toString() : (Array.isArray(items_to_receive) ? this._convertItems(items_to_receive) : items.toString())
    if (items_to_send !== undefined) items_to_send = items_to_send instanceof Item ? items_to_send.id.toString() : (Array.isArray(items_to_send) ? this._convertitems_to_send(items_to_send) : items_to_send.toString())
    twofactor_code = twofactor_code ? twofactor_code : this.manager.op2fa.code()

    params = { uid, token, twofactor_code, items, message }
    if (items !== undefined) params.items = items;
    if (items_to_receive !== undefined) params.items_to_receive = items_to_receive;
    if (items_to_send !== undefined) params.items_to_send = items_to_send;
        
    const res = await this.ITrade.SendOffer(params)

    return new Offer(this.manager, res.response.offer)
  }

  async SendOfferToSteamId(params = {}) {
    if (!params.steam_id) throw new Missing('steam_id')
    if (!params.items && !params.items_to_receive && !params.items_to_send) throw new Missing('items')

    let { steam_id, items, twofactor_code, message = '' } = params

    if (items !== undefined) items = items instanceof Item ? items.id.toString() : (Array.isArray(items) ? this._convertItems(items) : items.toString())
    if (items_to_receive !== undefined) items_to_receive = items_to_receive instanceof Item ? items_to_receive.id.toString() : (Array.isArray(items_to_receive) ? this._convertItems(items_to_receive) : items.toString())
    if (items_to_send !== undefined) items_to_send = items_to_send instanceof Item ? items_to_send.id.toString() : (Array.isArray(items_to_send) ? this._convertitems_to_send(items_to_send) : items_to_send.toString())
    twofactor_code = twofactor_code ? twofactor_code : this.manager.op2fa.code()

    params = { steam_id, twofactor_code, items, message }
    if (items !== undefined) params.items = items;
    if (items_to_receive !== undefined) params.items_to_receive = items_to_receive;
    if (items_to_send !== undefined) params.items_to_send = items_to_send;
    
    const res = await this.ITrade.SendOfferToSteamId(params)

    return new Offer(this.manager, res.response.offer)
  }
}

module.exports = ITrade
