/**
 * FixAPIController
 *
 */
var express = require('express');
var app = express();
var fetch = require('node-fetch');
const Bluebird = require('bluebird');
fetch.Promise = Bluebird;
var i18n = require("i18n");
var logger = require("./logger");
// Files Inludes
var { AppController } = require('./AppController');
const constants = require('../../config/constants');
var Helper = require("../../helpers/helpers");
var Currency = require("../../helpers/currency");

/**
 * FIX API controller
 */
class TradeController extends AppController {

  constructor() {
    super();
  }

  async marketSell(req, res, next) {
    try {
      let {
        symbol,
        side,
        order_type,
        orderQuantity,
        // user_id
      } = req.body;
      var user_id = await Helper.getUserId(req.headers);
      let userIds = [];
      userIds.push(user_id);

      var tradeDataChecking = await TradeStatusChecking.tradeStatus(user_id);

      if ((tradeDataChecking.response == true || tradeDataChecking.response == "true") && (tradeDataChecking.status == false || tradeDataChecking.status == "false")) {

        orderQuantity = parseFloat(orderQuantity);
        // Get Currency/Crypto each asset
        let { crypto, currency } = await Currency.get_currencies(symbol);
        // Get and check Crypto Wallet details
        let crypto_wallet_data = await WalletHelper.checkWalletStatus(crypto, user_id);
        if (crypto_wallet_data == 0) {
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Currency Wallet").message, []);
        } else if (crypto_wallet_data == 2) {
          return Helper.jsonFormat(res, constants.NO_RECORD, i18n.__("Coin not found").message, []);
        }

        // Check balance sufficient or not
        if (parseFloat(crypto_wallet_data.balance) <= orderQuantity) {
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Insufficient balance to place order").message, []);
        }
        let object = {
          crypto: crypto,
          currency: currency,
          symbol: symbol,
          side: side,
          order_type: order_type,
          orderQuantity: orderQuantity,
          user_id: user_id,
          crypto_wallet_data: crypto_wallet_data,
          // currency_wallet_data: currency_wallet_data,
          userIds: userIds
        };
        let market_sell_order = await module.exports.makeMarketSellOrder(res, object);
        if (market_sell_order.status > 1) {
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__(market_sell_order.message).message, []);
        } else {
          return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__('Order Success').message, []);
        }
      } else if (tradeDataChecking.status == true || tradeDataChecking.status == "true") {
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__('panic button enabled').message, []);
      } else if (tradeDataChecking.response == false || tradeDataChecking.response == "false") {
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__(tradeDataChecking.msg).message, []);
      }

    } catch (err) {
      console.log("err", err);
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("server error").message, []);
    }
  }
}

module.exports = new TradeController();