/**
 * TradeController
 *
 */
const { raw } = require('objection');
var express = require('express');
var app = express();
var moment = require('moment');
var fetch = require('node-fetch');
const Bluebird = require('bluebird');
fetch.Promise = Bluebird;
var twilio = require('twilio');
var request = require('request');
var xmlParser = require('xml2json');
var i18n = require("i18n");
var logger = require("./logger");
// Files Inludes
var { AppController } = require('./AppController');
const constants = require('../../config/constants');
var Helper = require("../../helpers/helpers");
var Currency = require("../../helpers/currency");
var WalletHelper = require("../../helpers/check-wallet-status");
var BuyBookHelper = require("../../helpers/buy/get-buy-book-order");
var MakerTakerFees = require("../../helpers/wallet/get-maker-taker-fees");
var ActivityAdd = require("../../helpers/activity/add");
var ActivityUpdate = require("../../helpers/activity/update");
var TradingFees = require("../../helpers/wallet/get-trading-fees");
var TradeAdd = require("../../helpers/trade/add");
var BuyAdd = require("../../helpers/buy/add-buy-order");
var SellAdd = require("../../helpers/sell/add-sell-order");
var OrderUpdate = require("../../helpers/buy/update-buy-order");
var OrderDelete = require("../../helpers/buy/delete-order");
var UserNotifications = require("../../models/UserNotifications");
var Users = require("../../models/UsersModel");
var ActivityHelper = require("../../helpers/activity/add");
var ActivityUpdateHelper = require("../../helpers/activity/update");
var sellUpdate = require("../../helpers/sell/update");
var sellDelete = require("../../helpers/sell/delete-order");
var limitMatch = require("../../helpers/limit/limit-buy-match");
var limitSellMatch = require("../../helpers/limit/limit-sell-match");
var socketHelper = require("../../helpers/sockets/emit-trades");
var WalletBalanceHelper = require("../../helpers/wallet/get-wallet-balance");
var SellBookHelper = require("../../helpers/sell/get-sell-book-order");
var SellWalletBalanceHelper = require("../../helpers/wallet/get-sell-wallet-balance");
var getPendingOrderDetails = require("../../helpers/pending/get-pending-order-details");
var StopLimitBuyExecute = require("../../helpers/stop/stop-limit-buy");
var StopLimitSellExecute = require("../../helpers/stop/stop-limit-sell");
var CoinsModel = require("../../models/Coins");
var WalletModel = require("../../models/Wallet");
var StopLimitAdd = require("../../helpers/stop-limit-sell-add-pending");
var StopLimitBuyAdd = require("../../helpers/stop-limit-buy-add-pending");
var TradeHistoryModel = require("../../models/TradeHistory");
var TradeStatusChecking = require("../../helpers/user-trade-checking");
var cancelPendingHelper = require("../../helpers/pending/cancel-pending-data");
var RefferalHelper = require("../../helpers/get-refffered-amount");
/**
 * Trade Controller : Used for live tradding
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

        if (orderQuantity <= 0) {
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Invalid Quantity").message, []);
        }
        // Get Currency/Crypto each asset
        let { crypto, currency } = await Currency.get_currencies(symbol);

        if (crypto == currency) {
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Currency and Crypto should not be same").message, []);
        }
        // Get and check Crypto Wallet details
        let crypto_wallet_data = await WalletHelper.checkWalletStatus(crypto, user_id);
        if (crypto_wallet_data == 0) {
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Currency Wallet").message, []);
        } else if (crypto_wallet_data == 2) {
          return Helper.jsonFormat(res, constants.NO_RECORD, i18n.__("Coin not found").message, []);
        }
        let crypto_wallet_data1 = await WalletHelper.checkWalletStatus(currency, user_id);

        if (crypto_wallet_data1 == 0) {
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Crypto Wallet").message, []);
        } else if (crypto_wallet_data1 == 2) {
          return Helper.jsonFormat(res, constants.NO_RECORD, i18n.__("Coin not found").message, []);
        }

        // Check balance sufficient or not
        if (parseFloat(crypto_wallet_data.placed_balance) <= orderQuantity) {
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

  // Helper : Market Sell Order
  async makeMarketSellOrder(res, alldata) {
    let {
      crypto,
      currency,
      symbol,
      side,
      order_type,
      orderQuantity,
      user_id,
      crypto_wallet_data,
      currency_wallet_data,
      userIds
    } = alldata;

    // Make Market Sell order
    let buy_book_data = await BuyBookHelper.getBuyBookOrder(crypto, currency);

    let maker_taker_fees = await MakerTakerFees.getFeesValue(crypto, currency);

    var quantityValue = orderQuantity.toFixed(process.env.QUANTITY_PRECISION)
    var tradeOrder;
    if (buy_book_data && buy_book_data.length > 0) {
      var availableQty = buy_book_data[0].quantity;
      var currentBuyBookDetails = buy_book_data[0];
      var priceValue = (currentBuyBookDetails.price).toFixed(process.env.PRICE_PRECISION)
      var now = new Date();
      var orderData = {
        user_id: user_id,
        symbol: symbol,
        side: side,
        order_type: order_type,
        created_at: now,
        updated_at: now,
        maximum_time: now,
        fill_price: priceValue,
        limit_price: 0,
        stop_price: 0,
        price: 0,
        quantity: quantityValue,
        order_status: "partially_filled",
        currency: currency,
        settle_currency: crypto
      }

      var resultData = {
        ...orderData
      }
      resultData.is_market = true;
      resultData.fix_quantity = quantityValue;
      resultData.maker_fee = maker_taker_fees.makerFee;
      resultData.taker_fee = maker_taker_fees.takerFee;
      // Log this in Activity
      await ActivityAdd.addActivityData(resultData)
      if (quantityValue <= availableQty) {
        if ((quantityValue).toFixed(process.env.TOTAL_PRECISION) <= (crypto_wallet_data.placed_balance).toFixed(process.env.TOTAL_PRECISION)) {
          var trade_history_data = {
            ...orderData
          };
          trade_history_data.maker_fee = maker_taker_fees.makerFee;
          trade_history_data.taker_fee = maker_taker_fees.takerFee;
          trade_history_data.quantity = quantityValue;
          trade_history_data.requested_user_id = currentBuyBookDetails.user_id;
          trade_history_data.created_at = now;
          trade_history_data.fix_quantity = quantityValue;
          // Update activity
          await ActivityUpdate.updateActivityData(currentBuyBookDetails.activity_id, trade_history_data)
          userIds.push(parseInt(trade_history_data.requested_user_id));
          var request = {
            requested_user_id: trade_history_data.requested_user_id,
            user_id: user_id,
            currency: currency,
            side: side,
            settle_currency: crypto,
            quantity: quantityValue,
            fill_price: priceValue
          }

          var tradingFees = await TradingFees.getTraddingFees(request, maker_taker_fees.makerFee, maker_taker_fees.takerFee)

          trade_history_data.user_fee = (tradingFees.userFee);
          trade_history_data.requested_fee = (tradingFees.requestedFee);
          trade_history_data.user_coin = currency;
          trade_history_data.requested_coin = crypto;
          // Log into trade history
          let tradeHistory = await TradeAdd.addTradeHistory(trade_history_data);
          tradeOrder = tradeHistory;
          let remainigQuantity = availableQty - quantityValue;

          if (remainigQuantity > 0) {
            let updatedBuyBook = await OrderUpdate.updateBuyBook(currentBuyBookDetails.id, {
              quantity: (remainigQuantity).toFixed(process.env.QUANTITY_PRECISION)
            })
          } else {
            let deleteBuyBook = await OrderDelete.deleteOrder(currentBuyBookDetails.id)
          }

        } else {
          return {
            status: 2,
            message: 'Insufficient balance to place order'
          }
        }
      } else {
        var remainingQty = quantityValue - availableQty;
        if ((quantityValue).toFixed(process.env.TOTAL_PRECISION) <= (crypto_wallet_data.placed_balance).toFixed(process.env.TOTAL_PRECISION)) {
          var trade_history_data = {
            ...orderData
          };
          trade_history_data.maker_fee = maker_taker_fees.makerFee;
          trade_history_data.taker_fee = maker_taker_fees.takerFee;
          trade_history_data.quantity = availableQty;
          trade_history_data.requested_user_id = currentBuyBookDetails.user_id;
          trade_history_data.created_at = now;

          trade_history_data.fix_quantity = quantityValue;

          let updatedActivity = await ActivityUpdate.updateActivityData(currentBuyBookDetails.activity_id, trade_history_data)
          userIds.push(parseInt(trade_history_data.requested_user_id));
          var request = {
            requested_user_id: trade_history_data.requested_user_id,
            user_id: user_id,
            currency: currency,
            side: side,
            settle_currency: crypto,
            quantity: availableQty,
            fill_price: priceValue
          }

          var tradingFees = await TradingFees.getTraddingFees(request, maker_taker_fees.makerFee, maker_taker_fees.takerFee)
          trade_history_data.user_fee = (tradingFees.userFee);
          trade_history_data.requested_fee = (tradingFees.requestedFee);
          trade_history_data.user_coin = currency;
          trade_history_data.requested_coin = crypto;

          let tradeHistory = await TradeAdd.addTradeHistory(trade_history_data);
          tradeOrder = tradeHistory;
          let deleteBuyBook = await OrderDelete.deleteOrder(currentBuyBookDetails.id)

          let object = {
            crypto: crypto,
            currency: currency,
            symbol: symbol,
            user_id: user_id,
            side: side,
            order_type: order_type,
            orderQuantity: remainingQty,
            crypto_wallet_data: crypto_wallet_data,
            userIds: userIds
          };
          let market_sell_order = await module.exports.makeMarketSellOrder(res, object);

        } else {
          return {
            status: 2,
            message: 'Insufficient balance to place order'
          }
        }
        // Check for referral
        let referredData = await RefferalHelper.getAmount(tradeOrder, user_id, tradeOrder.id);
      }
    } else {
      return {
        status: 2,
        message: 'Order Book Empty'
      }
    }

    for (var i = 0; i < userIds.length; i++) {
      // Notification Sending for users
      var userNotification = await UserNotifications.getSingleData({
        user_id: userIds[i],
        deleted_at: null,
        slug: 'trade_execute'
      })
      var user_data = await Users.getSingleData({
        deleted_at: null,
        id: userIds[i],
        is_active: true
      });
      if (user_data != undefined) {
        if (userNotification != undefined) {
          if (userNotification.email == true || userNotification.email == "true") {
            if (user_data.email != undefined) {
              var allData = {
                template: "emails/general_mail.ejs",
                templateSlug: "trade_execute",
                email: user_data.email,
                user_detail: user_data,
                formatData: {
                  recipientName: user_data.first_name
                }
              }
              await Helper.SendEmail(res, allData)
            }
          }
          if (userNotification.text == true || userNotification.text == "true") {
            if (user_data.phone_number != undefined) {
              // await sails.helpers.notification.send.text("trade_execute", user_data)
            }
          }
        }
      }
    }
    //Emit data in rooms
    let emit_socket = await socketHelper.emitTrades(crypto, currency, userIds)
    console.log("FINALLLY");
    return {
      status: 1,
      message: ''
    }
  }
  // Used for Buy Market order
  async marketBuy(req, res) {

    try {
      let {
        symbol,
        side,
        order_type,
        orderQuantity,
      } = req.body;
      var user_id = await Helper.getUserId(req.headers);
      var userIds = [];
      userIds.push(user_id);

      var tradeDataChecking = await TradeStatusChecking.tradeStatus(user_id);

      if ((tradeDataChecking.response == true || tradeDataChecking.response == "true") && (tradeDataChecking.status == false || tradeDataChecking.status == "false")) {

        orderQuantity = parseFloat(orderQuantity);

        if (orderQuantity <= 0) {
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Invalid Quantity").message, []);
        }

        // Get Currency/Crypto each asset
        let { crypto, currency } = await Currency.get_currencies(symbol);

        if (crypto == currency) {
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Currency and Crypto should not be same").message, []);
        }
        // Get and check Crypto Wallet details
        let crypto_wallet_data = await WalletBalanceHelper.getWalletBalance(crypto, currency, user_id);
        if (crypto_wallet_data == 1)
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Currency Wallet").message, []);
        let crypto_wallet_data_crypto1 = await WalletBalanceHelper.getWalletBalance(currency, crypto, user_id);
        if (crypto_wallet_data_crypto1 == 1)
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Crypto Wallet").message, []);
        if (crypto_wallet_data == 0) {
          return Helper.jsonFormat(res, constants.NO_RECORD, i18n.__("Coin not found").message, []);
        }

        // // Check balance sufficient or not
        // if (parseFloat(crypto_wallet_data.placed_balance) <= orderQuantity) {
        //   return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Insufficient balance to place order").message, []);
        // }
        var responseData = await module.exports.makeMarketBuyOrder(symbol,
          side,
          order_type,
          orderQuantity,
          user_id,
          res);

        if (responseData.status > 1) {
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__(responseData.message).message, []);
        } else {
          return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__('Order Success').message, []);
        }
      } else if (tradeDataChecking.status == true || tradeDataChecking.status == "true") {
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__('panic button enabled').message, []);
      } else if (tradeDataChecking.response == false || tradeDataChecking.response == "false") {
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__(tradeDataChecking.msg).message, []);
      }

      // console.log(responseData)
    } catch (err) {
      console.log("err", err);
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("server error").message, []);
    }
  }

  // Used for function to make Market Buy order
  async makeMarketBuyOrder(symbol, side, order_type, orderQuantity, user_id, res) {
    const checkUser = Helper.checkWhichUser(user_id);
    var userIds = [];
    userIds.push(user_id);
    console.log("userIds", userIds)
    let { crypto, currency } = await Currency.get_currencies(symbol);
    console.log("crypto, currency", crypto, currency)
    let wallet = await WalletBalanceHelper.getWalletBalance(crypto, currency, user_id);
    let sellBook = await SellBookHelper.sellOrderBook(crypto, currency);
    let fees = await MakerTakerFees.getFeesValue(crypto, currency);
    var quantityFixed = orderQuantity;
    var quantityValue = parseFloat(quantityFixed).toFixed(8);
    var tradeOrder;
    if (sellBook && sellBook.length > 0) {
      console.log("sellBook[0]", sellBook[0])
      var availableQuantity = sellBook[0].quantity;
      var currentSellBookDetails = sellBook[0];
      var fillPriceValue = parseFloat(currentSellBookDetails.price).toFixed(8);
      var now = new Date();
      var orderData = {
        user_id: user_id,
        symbol: symbol,
        side: side,
        order_type: order_type,
        created_at: now,
        updated_at: now,
        maximum_time: now,
        fill_price: fillPriceValue,
        limit_price: 0,
        stop_price: 0,
        price: 0,
        quantity: quantityValue,
        order_status: "partially_filled",
        currency: currency,
        settle_currency: crypto,
        placed_by:(checkUser ? 'bot':'user')
      }

      var resultData = {
        ...orderData
      }

      resultData.is_market = true;
      resultData.fix_quantity = quantityValue;
      resultData.maker_fee = fees.makerFee;
      resultData.taker_fee = fees.takerFee;

      var activity = await ActivityHelper.addActivityData(resultData);

      if (quantityValue <= availableQuantity) {
        if ((fillPriceValue * quantityValue).toFixed(8) <= (wallet.placed_balance).toFixed(8)) {
          var trade_history_data = {
            ...orderData
          };
          trade_history_data.maker_fee = (fees.makerFee).toFixed(8);
          trade_history_data.taker_fee = (fees.takerFee).toFixed(8);
          trade_history_data.quantity = quantityValue;
          trade_history_data.requested_user_id = currentSellBookDetails.user_id;
          trade_history_data.created_at = now;
          trade_history_data.fix_quantity = quantityValue;
          console.log("currentSellBookDetails", currentSellBookDetails);
          let updatedActivity = await ActivityUpdateHelper.updateActivityData(currentSellBookDetails.activity_id, trade_history_data);
          console.log("updatedActivity", updatedActivity)

          userIds.push(parseInt(trade_history_data.requested_user_id));
          console.log("userIds", userIds)

          var request = {
            requested_user_id: trade_history_data.requested_user_id,
            user_id: user_id,
            currency: currency,
            side: side,
            settle_currency: crypto,
            quantity: quantityValue,
            fill_price: fillPriceValue
          }

          var tradingFees = await TradingFees.getTraddingFees(request, fees.makerFee, fees.takerFee);
          // if (tradingFees == 1) {
          //   return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("server error").message, []);
          // }
          console.log("tradingFees", tradingFees)
          var usd_value = resultData * (request.fill_price * request.quantity);
          trade_history_data.user_fee = (tradingFees.userFee);
          trade_history_data.requested_fee = (tradingFees.requestedFee);
          trade_history_data.user_coin = crypto;
          trade_history_data.requested_coin = currency;
          console.log("trade_history_data", trade_history_data)

          let tradeHistory = await TradeAdd.addTradeHistory(trade_history_data);
          tradeOrder = tradeHistory;
          let remainigQuantity = availableQuantity - quantityValue;
          console.log("remainigQuantity", remainigQuantity)
          if (remainigQuantity > 0) {
            let updatedSellBook = await sellUpdate.updateSellBook(currentSellBookDetails.id, {
              quantity: remainigQuantity
            });
          } else {
            await sellDelete.deleteSellOrder(currentSellBookDetails.id);
          }
        } else {
          return {
            status: 2,
            message: 'Insufficient balance to place order'
          }
        }
      } else {
        var remainingQty = quantityValue - availableQuantity;
        if (parseFloat(fillPriceValue * quantityValue).toFixed(8) <= parseFloat(wallet.placed_balance).toFixed(8)) {
          var trade_history_data = {
            ...orderData
          };
          trade_history_data.maker_fee = (fees.makerFee).toFixed(8);
          trade_history_data.taker_fee = (fees.takerFee).toFixed(8);
          trade_history_data.quantity = availableQuantity;
          trade_history_data.requested_user_id = currentSellBookDetails.user_id;
          trade_history_data.created_at = now;
          trade_history_data.fix_quantity = quantityValue;
          console.log(trade_history_data)
          let updatedActivity = await ActivityUpdateHelper.updateActivityData(currentSellBookDetails.activity_id, trade_history_data);

          userIds.push(parseInt(trade_history_data.requested_user_id));
          var request = {
            requested_user_id: trade_history_data.requested_user_id,
            user_id: user_id,
            currency: currency,
            side: side,
            settle_currency: crypto,
            quantity: availableQuantity,
            fill_price: fillPriceValue
          }
          console.log(request);
          var tradingFees = await TradingFees.getTraddingFees(request, fees.makerFee, fees.takerFee);
          trade_history_data.user_fee = (tradingFees.userFee);
          trade_history_data.requested_fee = (tradingFees.requestedFee);
          trade_history_data.user_coin = crypto;
          trade_history_data.requested_coin = currency;

          let TradeHistory = await TradeAdd.addTradeHistory(trade_history_data);
          tradeOrder = TradeHistory;
          await sellDelete.deleteSellOrder(currentSellBookDetails.id);
          let requestData = {
            symbol,
            side,
            order_type,
            orderQuantity,
            user_id
          }
          requestData.orderQuantity = parseFloat(remainingQty).toFixed(8);
          console.log("requestData", requestData)
          // Again call same api
          let response = await module.exports.makeMarketBuyOrder(requestData.symbol, requestData.side, requestData.order_type, requestData.orderQuantity, requestData.user_id, res)
          console.log(response);
        } else {
          return {
            status: 2,
            message: 'Insufficient balance to place order'
          }
        }
      }
      // Check for referral
      let referredData = await RefferalHelper.getAmount(tradeOrder, user_id, tradeOrder.id);
    } else {
      return {
        status: 2,
        message: 'Order Book Empty'
      }
    }


    for (var i = 0; i < userIds.length; i++) {
      // Notification Sending for users
      var userNotification = await UserNotifications.getSingleData({
        user_id: userIds[i],
        deleted_at: null,
        slug: 'trade_execute'
      })
      var user_data = await Users.getSingleData({
        deleted_at: null,
        id: userIds[i],
        is_active: true
      });
      if (user_data != undefined) {
        if (userNotification != undefined) {
          if (userNotification.email == true || userNotification.email == "true") {
            if (user_data.email != undefined) {
              var allData = {
                template: "emails/general_mail.ejs",
                templateSlug: "trade_execute",
                email: user_data.email,
                user_detail: user_data,
                formatData: {
                  recipientName: user_data.first_name
                }
              }
              await Helper.SendEmail(res, allData)
            }
          }
          if (userNotification.text == true || userNotification.text == "true") {
            if (user_data.phone_number != undefined) {
              // await sails.helpers.notification.send.text("trade_execute", user_data)
            }
          }
        }
      }
    }

    //Emit data in rooms
    let emit_socket = await socketHelper.emitTrades(crypto, currency, userIds)
    console.log("FINALLLY");
    return {
      status: 1,
      message: ''
    }
  }

  // Used to Create Buy Limit order
  async limitBuy(req, res) {
    let {
      symbol,
      // user_id,
      side,
      order_type,
      orderQuantity,
      limit_price
    } = req.body;

    var user_id = await Helper.getUserId(req.headers);

    var tradeDataChecking = await TradeStatusChecking.tradeStatus(user_id);

    if ((tradeDataChecking.response == true || tradeDataChecking.response == "true") && (tradeDataChecking.status == false || tradeDataChecking.status == "false")) {

      orderQuantity = parseFloat(orderQuantity);

      if (orderQuantity <= 0) {
        return Helper.jsonFormat(res, constants.NO_RECORD, i18n.__("Invalid Quantity").message, []);
      }

      let { crypto, currency } = await Currency.get_currencies(symbol);

      if (crypto == currency) {
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Currency and Crypto should not be same").message, []);
      }
      // Get and check Crypto Wallet details
      let wallet = await WalletBalanceHelper.getWalletBalance(crypto, currency, user_id);
      if (wallet == 1)
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Currency Wallet").message, []);
      let crypto_wallet_data_crypto1 = await WalletBalanceHelper.getWalletBalance(currency, crypto, user_id);
      if (crypto_wallet_data_crypto1 == 1)
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Crypto Wallet").message, []);

      if (wallet == 0) {
        return Helper.jsonFormat(res, constants.NO_RECORD, i18n.__("Coin not found").message, []);
      }

      // if (parseFloat(wallet.balance) <= orderQuantity) {
      //   return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Insufficient balance to place order").message, []);
      // }

      let responseData = await module.exports.limitBuyOrder(symbol,
        user_id,
        side,
        order_type,
        orderQuantity,
        limit_price,
        res);

      if (responseData.status > 2) {
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__(responseData.message).message, []);
      } else if (responseData.status == 2) {
        return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__(responseData.message).message, []);
      }
      else if (responseData.status == 1) {
        return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__(responseData.message).message, []);
      }
    } else if (tradeDataChecking.status == true || tradeDataChecking.status == "true") {
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__('panic button enabled').message, []);
    } else if (tradeDataChecking.response == false || tradeDataChecking.response == "false") {
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__(tradeDataChecking.msg).message, []);
    }

  }

  // Used to execute Limit Buy Order
  async limitBuyOrder(symbol, user_id, side, order_type, orderQuantity, limit_price, res) {
    var userIds = [];
    userIds.push(parseInt(user_id));
    let { crypto, currency } = await Currency.get_currencies(symbol);
    let wallet = await WalletBalanceHelper.getWalletBalance(crypto, currency, user_id);
    let sellBook = await SellBookHelper.sellOrderBook(crypto, currency);
    let fees = await MakerTakerFees.getFeesValue(crypto, currency);
    var now = new Date();
    var quantityValue = parseFloat(orderQuantity).toFixed(8);
    var priceValue = parseFloat(limit_price).toFixed(8);

    var buyLimitOrderData = {
      'user_id': user_id,
      'symbol': symbol,
      'side': side,
      'order_type': order_type,
      'created_at': now,
      'updated_at': now,
      'fill_price': 0.0,
      'limit_price': priceValue,
      'stop_price': 0.0,
      'price': priceValue,
      'quantity': quantityValue,
      'fix_quantity': quantityValue,
      'order_status': "open",
      'currency': currency,
      'settle_currency': crypto,
      'maximum_time': now,
      'is_partially_fulfilled': false
    };

    var resultData = {
      ...buyLimitOrderData
    }
    resultData.is_market = false;
    resultData.fix_quantity = quantityValue

    var activity = await ActivityHelper.addActivityData(resultData);
    resultData.maker_fee = fees.makerFee;
    resultData.taker_fee = fees.takerFee;
    console.log(resultData);
    console.log("sellBook.length", sellBook.length)

    if (sellBook && sellBook.length > 0) {
      var currentPrice = sellBook[0].price;
      console.log("priceValue", priceValue)
      console.log("currentPrice", currentPrice)
      if (priceValue >= currentPrice) {
        var limitMatchData = await limitMatch.limitData(buyLimitOrderData, crypto, currency, activity, res);
        return {
          status: limitMatchData.status,
          message: limitMatchData.message
        };
        // Here Remainning
        // Send Notification to users
        // Emit Socket Event
      } else {
        console.log("INSIDE ELSE??????")
        buyLimitOrderData.activity_id = activity.id;
        var total_price = buyLimitOrderData.quantity * buyLimitOrderData.limit_price;
        if (total_price <= wallet.placed_balance) {
          buyLimitOrderData.is_partially_fulfilled = true;
          buyLimitOrderData.is_filled = false;
          buyLimitOrderData.added = true;
          console.log(buyLimitOrderData);
          var addBuyBook = await BuyAdd.addBuyBookData(buyLimitOrderData);
          addBuyBook.added = true;

          // Send Notification to users
          for (var i = 0; i < userIds.length; i++) {
            // Notification Sending for users
            var userNotification = await UserNotifications.getSingleData({
              user_id: userIds[i],
              deleted_at: null,
              slug: 'trade_execute'
            })
            var user_data = await Users.getSingleData({
              deleted_at: null,
              id: userIds[i],
              is_active: true
            });
            if (user_data != undefined) {
              if (userNotification != undefined) {
                if (userNotification.email == true || userNotification.email == "true") {
                  if (user_data.email != undefined) {
                    var allData = {
                      template: "emails/general_mail.ejs",
                      templateSlug: "trade_execute",
                      email: user_data.email,
                      user_detail: user_data,
                      formatData: {
                        recipientName: user_data.first_name
                      }
                    }
                    await Helper.SendEmail(res, allData)
                  }
                }
                if (userNotification.text == true || userNotification.text == "true") {
                  if (user_data.phone_number != undefined) {
                    // await sails.helpers.notification.send.text("trade_execute", user_data)
                  }
                }
              }
            }
          }

          // Emit Socket Event
          let emit_socket = await socketHelper.emitTrades(crypto, currency, userIds)
          return {
            status: 2,
            message: 'Order Palce Success'
          }
        } else {
          return {
            status: 3,
            message: 'Insufficient balance to place order'
          }
        }
      }
    } else {
      buyLimitOrderData.activity_id = activity.id;
      var total_price = parseFloat(buyLimitOrderData.quantity * buyLimitOrderData.limit_price).toFixed(8);
      if (total_price <= wallet.placed_balance) {
        buyLimitOrderData.is_partially_fulfilled = true;
        buyLimitOrderData.is_filled = false;
        buyLimitOrderData.added = true;
        var addBuyBook = await BuyAdd.addBuyBookData(buyLimitOrderData);
        addBuyBook.added = true;

        // Send Notification to users
        for (var i = 0; i < userIds.length; i++) {
          // Notification Sending for users
          var userNotification = await UserNotifications.getSingleData({
            user_id: userIds[i],
            deleted_at: null,
            slug: 'trade_execute'
          })
          var user_data = await Users.getSingleData({
            deleted_at: null,
            id: userIds[i],
            is_active: true
          });
          if (user_data != undefined) {
            if (userNotification != undefined) {
              if (userNotification.email == true || userNotification.email == "true") {
                if (user_data.email != undefined) {
                  var allData = {
                    template: "emails/general_mail.ejs",
                    templateSlug: "trade_execute",
                    email: user_data.email,
                    user_detail: user_data,
                    formatData: {
                      recipientName: user_data.first_name
                    }
                  }
                  await Helper.SendEmail(res, allData)
                }
              }
              if (userNotification.text == true || userNotification.text == "true") {
                if (user_data.phone_number != undefined) {
                  // await sails.helpers.notification.send.text("trade_execute", user_data)
                }
              }
            }
          }
        }

        // Emit Socket Event
        let emit_socket = await socketHelper.emitTrades(crypto, currency, userIds)
        return {
          status: 2,
          message: 'Order Palce Success'
        }
      } else {
        return {
          status: 3,
          message: 'Insufficient balance to place order'
        }
      }
    }
  }

  // Used to create Sell Limit Order
  async limitSell(req, res) {
    let {
      symbol,
      // user_id,
      side,
      order_type,
      orderQuantity,
      limit_price
    } = req.body;
    var user_id = await Helper.getUserId(req.headers);
    var tradeDataChecking = await TradeStatusChecking.tradeStatus(user_id);

    if ((tradeDataChecking.response == true || tradeDataChecking.response == "true") && (tradeDataChecking.status == false || tradeDataChecking.status == "false")) {

      orderQuantity = parseFloat(orderQuantity);

      if (orderQuantity <= 0) {
        return Helper.jsonFormat(res, constants.NO_RECORD, i18n.__("Invalid Quantity").message, []);
      }

      let { crypto, currency } = await Currency.get_currencies(symbol);

      if (crypto == currency) {
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Currency and Crypto should not be same").message, []);
      }
      // Get and check Crypto Wallet details
      // Get and check Crypto Wallet details
      let wallet = await WalletBalanceHelper.getWalletBalance(crypto, currency, user_id);
      if (wallet == 1)
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Currency Wallet").message, []);
      let crypto_wallet_data_crypto1 = await WalletBalanceHelper.getWalletBalance(currency, crypto, user_id);
      if (crypto_wallet_data_crypto1 == 1)
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Crypto Wallet").message, []);

      if (wallet == 0) {
        return Helper.jsonFormat(res, constants.NO_RECORD, i18n.__("Coin not found").message, []);
      }

      console.log("wallet.placed_balance", wallet.placed_balance);
      console.log("orderQuantity", orderQuantity)
      console.log("parseFloat(wallet.placed_balance) <= parseFloat(orderQuantity)", parseFloat(wallet.placed_balance) <= parseFloat(orderQuantity))
      if (parseFloat(wallet.placed_balance) <= parseFloat(orderQuantity)) {
        console.log("INSIDE IF>>>>>>")
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Insufficient balance to place order").message, []);
      }

      let responseData = await module.exports.limitSellOrder(symbol,
        user_id,
        side,
        order_type,
        orderQuantity,
        limit_price,
        res);

      if (responseData.status > 2) {
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__(responseData.message).message, []);
      } else if (responseData.status == 2) {
        return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__(responseData.message).message, []);
      }
      else if (responseData.status == 1) {
        return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__(responseData.message).message, []);
      }
    } else if (tradeDataChecking.status == true || tradeDataChecking.status == "true") {
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__('panic button enabled').message, []);
    } else if (tradeDataChecking.response == false || tradeDataChecking.response == "false") {
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__(tradeDataChecking.msg).message, []);
    }
  }

  // Used to execute Limit Sell Order
  async limitSellOrder(symbol, user_id, side, order_type, orderQuantity, limit_price, res) {
    var userIds = [];
    userIds.push(parseInt(user_id));
    let { crypto, currency } = await Currency.get_currencies(symbol);
    let wallet = await SellWalletBalanceHelper.getSellWalletBalance(crypto, currency, user_id);
    let buyBook = await BuyBookHelper.getBuyBookOrder(crypto, currency);
    let fees = await MakerTakerFees.getFeesValue(crypto, currency);
    var now = new Date();
    var quantityValue = parseFloat(orderQuantity).toFixed(8);
    var priceValue = parseFloat(limit_price).toFixed(8);

    var sellLimitOrderData = {
      'user_id': user_id,
      'symbol': symbol,
      'side': side,
      'order_type': order_type,
      'created_at': now,
      'updated_at': now,
      'fill_price': 0.0,
      'limit_price': priceValue,
      'stop_price': 0.0,
      'price': priceValue,
      'quantity': quantityValue,
      'fix_quantity': quantityValue,
      'order_status': "open",
      'currency': currency,
      'settle_currency': crypto,
      'maximum_time': now,
      'is_partially_fulfilled': false
    }

    var resultData = {
      ...sellLimitOrderData
    };
    resultData.is_market = false;
    resultData.fix_quantity = quantityValue;

    var activity = await ActivityHelper.addActivityData(resultData);
    resultData.maker_fee = fees.makerFee;
    resultData.taker_fee = fees.takerFee;
    console.log(resultData);

    if (buyBook && buyBook.length > 0) {
      var currentPrice = buyBook[0].price;
      if (priceValue <= currentPrice) {
        console.log("INSIDE IF")
        var limitSellMatchData = await limitSellMatch.limitSellData(sellLimitOrderData, crypto, currency, activity, res);
        return {
          status: limitSellMatchData.status,
          message: limitSellMatchData.message
        };
      } else {
        sellLimitOrderData.activity_id = activity.id;
        var total_price = parseFloat(sellLimitOrderData.quantity).toFixed(8);
        console.log("wallet", wallet)
        if (total_price <= wallet.placed_balance) {
          sellLimitOrderData.is_partially_fulfilled = true;
          sellLimitOrderData.is_filled = false;
          sellLimitOrderData.added = true;
          var addSellBook = await SellAdd.SellOrderAdd(sellLimitOrderData);
          addSellBook.added = true;

          // Send Notification to users
          for (var i = 0; i < userIds.length; i++) {
            // Notification Sending for users
            var userNotification = await UserNotifications.getSingleData({
              user_id: userIds[i],
              deleted_at: null,
              slug: 'trade_execute'
            })
            var user_data = await Users.getSingleData({
              deleted_at: null,
              id: userIds[i],
              is_active: true
            });
            if (user_data != undefined) {
              if (userNotification != undefined) {
                if (userNotification.email == true || userNotification.email == "true") {
                  if (user_data.email != undefined) {
                    var allData = {
                      template: "emails/general_mail.ejs",
                      templateSlug: "trade_execute",
                      email: user_data.email,
                      user_detail: user_data,
                      formatData: {
                        recipientName: user_data.first_name
                      }
                    }
                    await Helper.SendEmail(res, allData)
                  }
                }
                if (userNotification.text == true || userNotification.text == "true") {
                  if (user_data.phone_number != undefined) {
                    // await sails.helpers.notification.send.text("trade_execute", user_data)
                  }
                }
              }
            }
          }

          // Emit Socket Event
          let emit_socket = await socketHelper.emitTrades(crypto, currency, userIds)
          return {
            status: 2,
            message: 'Order Palce Success'
          }
        } else {
          return {
            status: 3,
            message: 'Insufficient balance to place order'
          }
        }
      }
    } else {
      sellLimitOrderData.activity_id = activity.id;
      var total_price = parseFloat(sellLimitOrderData.quantity).toFixed(8);
      if (total_price <= wallet.placed_balance) {
        sellLimitOrderData.is_partially_fulfilled = true;
        sellLimitOrderData.is_filled = false;
        sellLimitOrderData.added = true;
        var addSellBook = await SellAdd.SellOrderAdd(sellLimitOrderData);
        addSellBook.added = true;

        // Send Notification to users
        for (var i = 0; i < userIds.length; i++) {
          // Notification Sending for users
          var userNotification = await UserNotifications.getSingleData({
            user_id: userIds[i],
            deleted_at: null,
            slug: 'trade_execute'
          })
          var user_data = await Users.getSingleData({
            deleted_at: null,
            id: userIds[i],
            is_active: true
          });
          if (user_data != undefined) {
            if (userNotification != undefined) {
              if (userNotification.email == true || userNotification.email == "true") {
                if (user_data.email != undefined) {
                  var allData = {
                    template: "emails/general_mail.ejs",
                    templateSlug: "trade_execute",
                    email: user_data.email,
                    user_detail: user_data,
                    formatData: {
                      recipientName: user_data.first_name
                    }
                  }
                  await Helper.SendEmail(res, allData)
                }
              }
              if (userNotification.text == true || userNotification.text == "true") {
                if (user_data.phone_number != undefined) {
                  // await sails.helpers.notification.send.text("trade_execute", user_data)
                }
              }
            }
          }
        }

        // Emit Socket Event
        let emit_socket = await socketHelper.emitTrades(crypto, currency, userIds)
        return {
          status: 2,
          message: 'Order Palce Success'
        }
      } else {
        return {
          status: 3,
          message: 'Insufficient balance to place order'
        }
      }
    }
  }

  // Create Stop Limit Buy Order
  async stopLimitBuyOrder(req, res) {
    try {
      var {
        symbol,
        side,
        order_type,
        orderQuantity,
        limit_price,
        stop_price
        // user_id
      } = req.body;
      var user_id = await Helper.getUserId(req.headers);
      var tradeDataChecking = await TradeStatusChecking.tradeStatus(user_id);

      if ((tradeDataChecking.response == true || tradeDataChecking.response == "true") && (tradeDataChecking.status == false || tradeDataChecking.status == "false")) {

        console.log(req.body)

        if (orderQuantity <= 0) {
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Invalid Quantity").message, []);
        }
        let { crypto, currency } = await Currency.get_currencies(symbol);

        if (crypto == currency) {
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Currency and Crypto should not be same").message, []);
        }
        let wallet = await SellWalletBalanceHelper.getSellWalletBalance(crypto, currency, user_id);

        if (wallet == 1) {
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Crypto Wallet").message, []);
        }

        let wallet1 = await SellWalletBalanceHelper.getSellWalletBalance(currency, crypto, user_id);

        if (wallet == 1) {
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Currency Wallet").message, []);
        }
        // console.log(wallet)
        if (wallet == 0) {
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Coin not found").message, []);
        }
        var coinValue = await CoinsModel
          .query()
          .first()
          .where('is_active', true)
          .andWhere('deleted_at', null)
          .andWhere('coin', currency)
          .orderBy('id', 'DESC');

        var walletCurrency = await WalletModel
          .query()
          .select()
          .first()
          .where('deleted_at', null)
          .andWhere('coin_id', coinValue.id)
          .andWhere('is_active', true)
          .andWhere('user_id', user_id)
          .orderBy('id', 'DESC');

        console.log("walletCurrency", walletCurrency)

        if (walletCurrency == undefined) {
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Currency Wallet").message, []);
        }

        var cryptoValue = await CoinsModel
          .query()
          .first()
          .where('is_active', true)
          .andWhere('deleted_at', null)
          .andWhere('coin', crypto)
          .orderBy('id', 'DESC');

        var walletCrypto = await WalletModel
          .query()
          .select()
          .first()
          .where('deleted_at', null)
          .andWhere('coin_id', cryptoValue.id)
          .andWhere('is_active', true)
          .andWhere('user_id', user_id)
          .orderBy('id', 'DESC');

        console.log("walletCrypto", walletCrypto)

        if (walletCrypto == undefined) {
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Crypto Wallet").message, []);
        }

        // Add Geofencing over here
        var stop_limit_sell_response = await StopLimitBuyAdd.stopBuyAdd(symbol, user_id, side, order_type, orderQuantity, limit_price, stop_price, res);
        console.log("stop_limit_sell_response", stop_limit_sell_response)
        if (stop_limit_sell_response.status > 1) {
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__(stop_limit_sell_response.message).message, []);
        } else {
          return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("Order Palce Success").message, []);
        }
      } else if (tradeDataChecking.status == true || tradeDataChecking.status == "true") {
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__('panic button enabled').message, []);
      } else if (tradeDataChecking.response == false || tradeDataChecking.response == "false") {
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__(tradeDataChecking.msg).message, []);
      }
    } catch (error) {
      console.log(error);
    }
  }

  // Create Stop Limit Sell Order
  async stopLimitSellOrder(req, res) {
    try {
      var {
        symbol,
        side,
        order_type,
        orderQuantity,
        limit_price,
        stop_price
        // user_id
      } = req.body;
      var user_id = await Helper.getUserId(req.headers);

      var tradeDataChecking = await TradeStatusChecking.tradeStatus(user_id);

      if ((tradeDataChecking.response == true || tradeDataChecking.response == "true") && (tradeDataChecking.status == false || tradeDataChecking.status == "false")) {

        console.log("req.body", req.body)

        if (orderQuantity <= 0) {
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Invalid Quantity").message, []);
        }

        let { crypto, currency } = await Currency.get_currencies(symbol);

        if (crypto == currency) {
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Currency and Crypto should not be same").message, []);
        }

        let wallet = await WalletBalanceHelper.getWalletBalance(crypto, currency, user_id);
        if (wallet == 1)
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Currency Wallet").message, []);
        let crypto_wallet_data_crypto1 = await WalletBalanceHelper.getWalletBalance(currency, crypto, user_id);
        if (crypto_wallet_data_crypto1 == 1)
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Crypto Wallet").message, []);


        if (wallet == 0) {
          return Helper.jsonFormat(res, constants.NO_RECORD, i18n.__("Coin not found").message, []);
        }

        var coinValue = await CoinsModel
          .query()
          .first()
          .where('is_active', true)
          .andWhere('deleted_at', null)
          .andWhere('coin', currency)
          .orderBy('id', 'DESC');

        var walletCurrency = await WalletModel
          .query()
          .select()
          .first()
          .where('deleted_at', null)
          .andWhere('coin_id', coinValue.id)
          .andWhere('is_active', true)
          .andWhere('user_id', user_id)
          .orderBy('id', 'DESC');

        console.log("walletCurrency", walletCurrency)

        if (walletCurrency == undefined) {
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Currency Wallet").message, []);
        }

        var cryptoValue = await CoinsModel
          .query()
          .first()
          .where('is_active', true)
          .andWhere('deleted_at', null)
          .andWhere('coin', crypto)
          .orderBy('id', 'DESC');

        var walletCrypto = await WalletModel
          .query()
          .select()
          .first()
          .where('deleted_at', null)
          .andWhere('coin_id', cryptoValue.id)
          .andWhere('is_active', true)
          .andWhere('user_id', user_id)
          .orderBy('id', 'DESC');

        console.log("walletCrypto", walletCrypto)

        if (walletCrypto == undefined) {
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Crypto Wallet").message, []);
        }

        // Add Geofencing over here
        var stop_limit_buy_response = await StopLimitAdd.stopSellAdd(symbol, user_id, side, order_type, orderQuantity, limit_price, stop_price, res);

        console.log("stop_limit_buy_response", stop_limit_buy_response)

        if (stop_limit_buy_response.status > 1) {
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__(stop_limit_sell_response.message).message, []);
        } else {
          return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("Order Palce Success").message, []);
        }
      } else if (tradeDataChecking.status == true || tradeDataChecking.status == "true") {
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__('panic button enabled').message, []);
      } else if (tradeDataChecking.response == false || tradeDataChecking.response == "false") {
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__(tradeDataChecking.msg).message, []);
      }

    } catch (error) {
      console.log(error);
    }
  }

  // Cron for Pending Order execution
  async executeStopLimit() {
    var now = moment();
    // console.log(now);
    var pendingData = await getPendingOrderDetails.getPendingOrderDetails();
    console.log(pendingData.length)
    for (var i = 0; i < pendingData.length; i++) {
      var {
        order_type,
        side,
        maximum_time,
        id,
        quantity,
        stop_price,
        limit_price,
        settle_currency,
        currency,
        symbol,
        user_id,
        activity_id
      } = pendingData[i];

      var pendingOrderBook = {
        'id': id,
        'user_id': user_id,
        'symbol': symbol,
        'side': side,
        'order_type': order_type,
        'created_at': now.format(),
        'updated_at': now.format(),
        'maximum_time': now
          .add(1, 'years')
          .format(),
        'fill_price': 0.0,
        'limit_price': limit_price,
        'stop_price': stop_price,
        'price': 0.0,
        'quantity': quantity,
        'settle_currency': settle_currency,
        'order_status': "open",
        'currency': currency,
        'activity_id': activity_id
      }

      console.log("pendingOrderBook", pendingOrderBook)

      if (pendingData.length > 0) {
        if (order_type == "StopLimit" && side == "Buy") {
          console.log("INSIDE BUY")
          var pendigBuy = await StopLimitBuyExecute.stopLimitBuy(now, pendingOrderBook);
        } else if (order_type == "StopLimit" && side == "Sell") {
          console.log("INSIDE SELL", pendingOrderBook)
          var pendingSell = await StopLimitSellExecute.stopLimitSell(now, pendingOrderBook);
        }
      }
    }
  }

  async cancelPendingOrder(req, res) {
    try {
      var { side, id, order_type, user_id } = req.body;
      console.log(req.body);
      var cancel_pending_data = await cancelPendingHelper.cancelPendingOrder(side, order_type, id);
      console.log("cancel_pending_data", cancel_pending_data)
      if (cancel_pending_data == 0) {
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("No Buy Data Found").message, []);
      } else if (cancel_pending_data == 1) {
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("No Sell Data Found").message, []);
      } else if (cancel_pending_data == 3) {
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("No Pending Data Found").message, []);
      } else if (cancel_pending_data == 4) {
        return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("Order Cancelled").message, []);
      } else if (cancel_pending_data == 5) {
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("server error").message, []);
      }
    } catch (error) {
      console.log(error);
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("server error").message, []);
    }
  }

}

module.exports = new TradeController();