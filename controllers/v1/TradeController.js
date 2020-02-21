/**
 * TradeController
 *
 */
const {raw} = require('objection');
var express = require('express');
var app = express();
var moment = require('moment');
var fetch = require('node-fetch');
const Bluebird = require('bluebird');
fetch.Promise = Bluebird;
var twilio = require('twilio');
var request = require('request');
var xmlParser = require('xml2json');
var moment = require('moment');
var i18n = require("i18n");
var logger = require("./logger");
// Files Inludes
var {AppController} = require('./AppController');
const constants = require('../../config/constants');
var Helper = require("../../helpers/helpers");
var Currency = require("../../helpers/currency");


/**
 * Trade Controller : Used for live tradding
 */
class TradeController extends AppController {

  constructor() {
    super();
  }

  // Used to Sell market order
  async marketSell( req, res, next){
    try {
      let {
        symbol,
        side,
        order_type,
        orderQuantity
      } = req.allParams();
      orderQuantity = parseFloat(orderQuantity);
      // Get Currency/Crypto each asset
      let {crypto,currency} = Currency.get_currencies( symbol );
      console.log("crypto",crypto);
      console.log("currency",currency);

      return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__('Order Success'), []);
    }catch(err){
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("server error"), []);
    }
  }



}

module.exports = new TradeController();