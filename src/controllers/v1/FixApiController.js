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
var FixApiHelper = require("../../helpers/fixapi/get-jst-value");

/**
 * FIX API controller
 */
class FixApiController extends AppController {

  constructor() {
    super();
  }
  // Get Conversion Price
  async getConversionPrice(data) {
    try {
      let {
        Symbol,
        Side,
        OrderQty,
        Currency,
        OrdType,
        flag,
        offer_code,
        order_pair,
        original_pair,
        usd_value,
        user_id
      } = data;
      // var user_id = await Helper.getUserId(req.headers);
      if (Symbol == "XRP/ETH" || Symbol == "LTC/ETH") {
        return res.json({
          status: 200,
          data: [],
          message: sails.__("Pair does not supported").message,
          err: sails.__("Pair does not supported").message
        });
      }
      Symbol = Symbol.replace("/", "");
      console.log("Symbol", Symbol);
      var req_body = {
        "Symbol": Symbol,
        "Side": Side,
        "OrderQty": OrderQty,
        "Currency": Currency,
        "OrdType": OrdType,
        "flag": flag,
        "offer_code": offer_code,
        "order_pair": order_pair,
        "original_pair": original_pair,
        "usd_value": usd_value
      }

      // var user_id = req.user.id;
      req_body.user_id = user_id;
      var jstResponseValue = await FixApiHelper.priceObject(req_body);
      console.log(jstResponseValue);
      jstResponseValue.faldax_fee = jstResponseValue.faldax_fee;
      return jstResponseValue;
    } catch (err) {
      console.log("err", err);
      // return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("server error").message, []);
    }
  }
}

module.exports = new FixApiController();