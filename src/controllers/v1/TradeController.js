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
var fiatValueHelper = require("../../helpers/get-fiat-value");
var sellOrderBookSummary = require("../../helpers/sell/get-sell-book-order-summary");
var buyOrderBookSummary = require("../../helpers/buy/get-buy-book-order-summary");
var QueueValue = require("./QueueController");

/**
 * Trade Controller : Used for live tradding
 */
class TradeController extends AppController {

  constructor() {
    super();
  }

  async marketSell(req, res, next) {
    try {
      var user_id = await Helper.getUserId(req.headers, res);
      await logger.info({
        "module": "Market Sell",
        "user_id": "user_" + user_id,
        "url": "Trade Function",
        "type": "Entry"
      }, "Entered the function")
      let {
        symbol,
        side,
        order_type,
        orderQuantity,
        // user_id
      } = req.body;
      // get user id from header
      let userIds = [];
      userIds.push(user_id);

      let { crypto, currency } = await Currency.get_currencies(symbol);

      var quantityTotal = await buyOrderBookSummary.getBuyBookOrderSummary(crypto, currency);

      if (quantityTotal.total_quantity < orderQuantity) {
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Invalid Quantity").message, []);
      }

      var userData = await Users
        .query()
        .select()
        .first()
        .where("deleted_at", null)
        .andWhere("is_active", true)
        .andWhere("id", user_id)
        .orderBy("id", "DESC");

      // Check user user is allowed to trade or not
      var tradeDataChecking = await TradeStatusChecking.tradeStatus(user_id);

      if ((tradeDataChecking.response == true || tradeDataChecking.response == "true" || (userData != undefined && userData.account_tier == 4)) && (tradeDataChecking.status == false || tradeDataChecking.status == "false")) {
        // console.log("INSIDE IF")
        orderQuantity = parseFloat(orderQuantity);

        // Order Quantity Validation
        if (orderQuantity <= 0) {
          await logger.info({
            "module": "Market Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Success"
          }, i18n.__("Invalid Quantity").message);
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Invalid Quantity").message, []);
        }

        // Get Currency/Crypto each asset

        if (crypto == currency) {
          await logger.info({
            "module": "Market Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Success"
          }, i18n.__("Currency and Crypto should not be same").message);
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Currency and Crypto should not be same").message, []);
        }

        // Get and check Crypto Wallet details
        let walletData = await WalletHelper.checkWalletStatus(crypto, currency, user_id);
        if (!walletData.currency) {
          await logger.info({
            "module": "Market Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Success"
          }, i18n.__("Create Currency Wallet").message);
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Currency Wallet").message, []);
        }
        if (!walletData.crypto) {
          await logger.info({
            "module": "Market Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Success"
          }, i18n.__("Create Crypto Wallet").message);
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Crypto Wallet").message, []);
        }
        const checkUser = Helper.checkWhichUser(user_id);

        // Check balance sufficient or not
        console.log("crypto_wallet_data.placed_balance", JSON.stringify(walletData.crypto.placed_balance))
        if ((parseFloat(walletData.crypto.placed_balance) <= orderQuantity) && checkUser != true) {
          await logger.info({
            "module": "Market Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Success"
          }, i18n.__("Insufficient balance to place order").message);
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
          crypto_wallet_data: walletData.crypto,
          userIds: userIds
        };
        console.log(JSON.stringify(walletData))

        console.log("walletData.crypto.coin_id", JSON.stringify(walletData.crypto.coin_id))
        let market_sell_order = await module.exports.makeMarketSellOrder(res, object, walletData.crypto.coin_id, walletData.currency.coin_id);
        console.log("market_sell_order", JSON.stringify(market_sell_order))

        // await logger.info({
        //   "module": "Market Sell",
        //   "user_id": "user_" + user_id,
        //   "url": "Trade Function",
        //   "type": "Success"
        // }, market_sell_order)
        if (market_sell_order.status > 1) {
          await logger.info({
            "module": "Market Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Success"
          }, i18n.__(market_sell_order.message).message);
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__(market_sell_order.message).message, []);
        } else {
          await logger.info({
            "module": "Market Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Success"
          }, i18n.__('Order Success').message);
          return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__('Order Success').message, []);
        }
      } else if (tradeDataChecking.status == true || tradeDataChecking.status == "true") {
        await logger.info({
          "module": "Market Buy",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Success"
        }, i18n.__('panic button enabled').message);
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__('panic button enabled').message, []);
      } else if (tradeDataChecking.response == false || tradeDataChecking.response == "false") {
        await logger.info({
          "module": "Market Buy",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Success"
        }, i18n.__(tradeDataChecking.msg).message);
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__(tradeDataChecking.msg).message, []);
      }


    } catch (err) {
      console.log("err", JSON.stringify(err));
      await logger.error({
        "module": "Market Sell",
        "user_id": "user_" + user_id,
        "url": "Trade Function",
        "type": "Error"
      }, err)
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("server error").message, []);
    }
  }

  // Helper : Market Sell Order
  async makeMarketSellOrder(res, alldata, crypto_coin_id, currency_coin_id) {
    await logger.info({
      "module": "Market Sell Execution",
      "user_id": "user_" + alldata.user_id,
      "url": "Trade Function",
      "type": "Entry"
    }, "Enter the function with " + allData)
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
    console.log("alldata", alldata)
    const checkUser = Helper.checkWhichUser(user_id);
    // Make Market Sell order
    let buy_book_data = await BuyBookHelper.getBuyBookOrder(crypto, currency);
    if (crypto_wallet_data.placed_balance < orderQuantity) {
      var userNotification = await UserNotifications.getSingleData({
        user_id: user_id,
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
                templateSlug: "order_failed",
                email: user_data.email,
                user_detail: user_data,
                formatData: {
                  recipientName: user_data.first_name,
                  reason: i18n.__("Insufficient balance to place order").message
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

    console.log("buy_book_data", buy_book_data)

    // let maker_taker_fees = await MakerTakerFees.getFeesValue(crypto, currency);

    var quantityValue = orderQuantity.toFixed(process.env.QUANTITY_PRECISION)
    var tradeOrder;
    if (buy_book_data && buy_book_data.length > 0) {
      var availableQty = buy_book_data[0].quantity;
      console.log("availableQty", availableQty)
      var currentBuyBookDetails = buy_book_data[0];
      var priceValue = (currentBuyBookDetails.price).toFixed(process.env.PRICE_PRECISION);
      console.log("priceValue", priceValue)
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
        settle_currency: crypto,
        placed_by: (checkUser ? process.env.TRADEDESK_MANUAL : process.env.TRADEDESK_USER)
      }

      var resultData = {
        ...orderData
      }
      resultData.is_market = true;
      resultData.fix_quantity = quantityValue;
      resultData.maker_fee = 0;
      resultData.taker_fee = 0;
      // Log this in Activity
      await ActivityAdd.addActivityData(resultData);
      console.log("quantityValue <= availableQty", quantityValue <= availableQty)
      var buyBookValue = await BuyBookHelper.getBuyBookOrder(crypto, currency);
      availableQty = buyBookValue[0].quantity
      if (quantityValue <= availableQty) {
        // console.log("buyBookValue", buyBookValue)
        let remainigQuantity = buyBookValue[0].quantity - quantityValue;
        console.log("remainigQuantity", remainigQuantity)
        if (remainigQuantity > 0) {
          let updatedBuyBook = await OrderUpdate.updateBuyBook(buyBookValue[0].id, {
            quantity: (remainigQuantity).toFixed(process.env.QUANTITY_PRECISION)
          })
          var trade_history_data = {
            ...orderData
          };
          trade_history_data.maker_fee = 0;
          trade_history_data.taker_fee = 0;
          trade_history_data.quantity = quantityValue;
          trade_history_data.requested_user_id = buyBookValue[0].user_id;
          trade_history_data.created_at = now;
          trade_history_data.fix_quantity = quantityValue;
          if (buyBookValue[0].is_stop_limit == true) {
            trade_history_data.is_stop_limit = true;
          }
          // Update activity
          await ActivityUpdate.updateActivityData(buyBookValue[0].activity_id, trade_history_data)
          userIds.push(parseInt(trade_history_data.requested_user_id));
          var request = {
            requested_user_id: trade_history_data.requested_user_id,
            user_id: user_id,
            currency: currency,
            side: side,
            settle_currency: crypto,
            quantity: quantityValue,
            fill_price: priceValue,
            crypto_coin_id,
            currency_coin_id
          }

          var tradingFees = await TradingFees.getTraddingFees(request)

          trade_history_data.user_fee = (tradingFees.userFee);
          trade_history_data.requested_fee = (tradingFees.requestedFee);
          trade_history_data.user_coin = currency;
          trade_history_data.requested_coin = crypto;
          trade_history_data.maker_fee = tradingFees.maker_fee;
          trade_history_data.taker_fee = tradingFees.taker_fee;
          trade_history_data.fiat_values = await fiatValueHelper.getFiatValue(crypto, currency);
          console.log("trade_history_data", JSON.stringify(trade_history_data))
          // Log into trade history
          let tradeHistory = await TradeAdd.addTradeHistory(trade_history_data);
          tradeOrder = tradeHistory;
        } else {
          // await logger.info({
          //   "module": "Market Sell Execution",
          //   "user_id": "user_" + alldata.user_id,
          //   "url": "Trade Function",
          //   "type": "Success"
          // }, tradeHistory)
          let deleteBuyBook = await OrderDelete.deleteOrder(buyBookValue[0].id)
          var trade_history_data = {
            ...orderData
          };
          trade_history_data.maker_fee = 0;
          trade_history_data.taker_fee = 0;
          trade_history_data.quantity = quantityValue;
          trade_history_data.requested_user_id = buyBookValue[0].user_id;
          trade_history_data.created_at = now;
          trade_history_data.fix_quantity = quantityValue;
          if (buyBookValue[0].is_stop_limit == true) {
            trade_history_data.is_stop_limit = true;
          }
          // Update activity
          await ActivityUpdate.updateActivityData(buyBookValue[0].activity_id, trade_history_data)
          userIds.push(parseInt(trade_history_data.requested_user_id));
          var request = {
            requested_user_id: trade_history_data.requested_user_id,
            user_id: user_id,
            currency: currency,
            side: side,
            settle_currency: crypto,
            quantity: quantityValue,
            fill_price: priceValue,
            crypto_coin_id,
            currency_coin_id
          }

          var tradingFees = await TradingFees.getTraddingFees(request)

          trade_history_data.user_fee = (tradingFees.userFee);
          trade_history_data.requested_fee = (tradingFees.requestedFee);
          trade_history_data.user_coin = currency;
          trade_history_data.requested_coin = crypto;
          trade_history_data.maker_fee = tradingFees.maker_fee;
          trade_history_data.taker_fee = tradingFees.taker_fee;
          trade_history_data.fiat_values = await fiatValueHelper.getFiatValue(crypto, currency);
          console.log("trade_history_data", JSON.stringify(trade_history_data))
          // Log into trade history
          let tradeHistory = await TradeAdd.addTradeHistory(trade_history_data);
          tradeOrder = tradeHistory;
        }
      } else {
        console.log("INSIDE ELSe")
        var remainingQty = quantityValue - availableQty;
        console.log("remainingQty", remainingQty);
        console.log("quantityValue", quantityValue);
        console.log("availableQty", availableQty)
        var trade_history_data = {
          ...orderData
        };
        trade_history_data.maker_fee = 0.0;
        trade_history_data.taker_fee = 0.0;
        trade_history_data.quantity = availableQty;
        trade_history_data.requested_user_id = currentBuyBookDetails.user_id;
        trade_history_data.created_at = now;

        trade_history_data.fix_quantity = quantityValue;
        console.log("trade_history_data", JSON.stringify(trade_history_data))

        if (currentBuyBookDetails.is_stop_limit == true) {
          trade_history_data.is_stop_limit = true;
        }

        let updatedActivity = await ActivityUpdate.updateActivityData(currentBuyBookDetails.activity_id, trade_history_data)
        userIds.push(parseInt(trade_history_data.requested_user_id));
        console.log("userIds", JSON.stringify(userIds))
        var request = {
          requested_user_id: trade_history_data.requested_user_id,
          user_id: user_id,
          currency: currency,
          side: side,
          settle_currency: crypto,
          quantity: quantityValue,
          fill_price: priceValue,
          crypto_coin_id,
          currency_coin_id
        }

        console.log("request", JSON.stringify(request))

        var tradingFees = await TradingFees.getTraddingFees(request)
        console.log("tradingFees", JSON.stringify(tradingFees))
        trade_history_data.user_fee = (tradingFees.userFee);
        trade_history_data.requested_fee = (tradingFees.requestedFee);
        trade_history_data.user_coin = currency;
        trade_history_data.requested_coin = crypto;
        trade_history_data.maker_fee = tradingFees.maker_fee;
        trade_history_data.taker_fee = tradingFees.taker_fee;
        trade_history_data.fiat_values = await fiatValueHelper.getFiatValue(crypto, currency);
        console.log("trade_history_data", JSON.stringify(trade_history_data))

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
        console.log("object", object)
        await logger.info({
          "module": "Market Sell Execution",
          "user_id": "user_" + alldata.user_id,
          "url": "Trade Function",
          "type": "Success"
        }, "Reccursion " + object)
        let market_sell_order = await module.exports.makeMarketSellOrder(res, object, crypto_coin_id, currency_coin_id);
      }
      // Check for referral
      let referredData = await RefferalHelper.getAmount(tradeOrder, user_id, tradeOrder.id);
    } else {
      await logger.info({
        "module": "Market Sell Execution",
        "user_id": "user_" + alldata.user_id,
        "url": "Trade Function",
        "type": "Success"
      }, "Order Book Empty")
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
                  recipientName: user_data.first_name,
                  side: tradeOrder.side,
                  pair: tradeOrder.symbol,
                  order_type: tradeOrder.order_type,
                  quantity: tradeOrder.quantity,
                  price: tradeOrder.fill_price,
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
    await logger.info({
      "module": "Market Sell Execution",
      "user_id": "user_" + alldata.user_id,
      "url": "Trade Function",
      "type": "Success"
    }, "Socket Emitted")
    return {
      status: 1,
      message: ''
    }
  }
  // Used for Buy Market order
  async marketBuy(req, res) {

    try {
      var user_id = await Helper.getUserId(req.headers, res);
      await logger.info({
        "module": "Market Buy",
        "user_id": "user_" + user_id,
        "url": "Trade Function",
        "type": "Entry"
      }, "Entered the function")
      let {
        symbol,
        side,
        order_type,
        orderQuantity,
      } = req.body;
      // var user_id = await Helper.getUserId(req.headers, res);

      let { crypto, currency } = await Currency.get_currencies(symbol);

      var quantityTotal = await sellOrderBookSummary.sellOrderBookSummary(crypto, currency);

      if (quantityTotal.total < orderQuantity) {
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Invalid Quantity").message, []);
      }

      var userIds = [];
      userIds.push(user_id);

      var userData = await Users
        .query()
        .select()
        .first()
        .where("deleted_at", null)
        .andWhere("is_active", true)
        .andWhere("id", user_id)
        .orderBy("id", "DESC");

      var tradeDataChecking = await TradeStatusChecking.tradeStatus(user_id);
      console.log("tradeDataChecking", JSON.stringify(tradeDataChecking))
      if ((tradeDataChecking.response == true || tradeDataChecking.response == "true" || (userData != undefined && userData.account_tier == 4)) && (tradeDataChecking.status == false || tradeDataChecking.status == "false")) {

        orderQuantity = parseFloat(orderQuantity);

        if (orderQuantity <= 0) {
          await logger.info({
            "module": "Market Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Entry"
          }, i18n.__("Invalid Quantity").message);
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Invalid Quantity").message, []);
        }

        // Get Currency/Crypto each asset

        if (crypto == currency) {
          await logger.info({
            "module": "Market Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Entry"
          }, i18n.__("Currency and Crypto should not be same").message)
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Currency and Crypto should not be same").message, []);
        }
        // Get and check Crypto Wallet details
        let walletData = await WalletHelper.checkWalletStatus(crypto, currency, user_id);
        if (!walletData.currency) {
          await logger.info({
            "module": "Market Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Entry"
          }, i18n.__("Create Currency Wallet").message)
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Currency Wallet").message, []);
        }
        if (!walletData.crypto) {
          await logger.info({
            "module": "Market Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Entry"
          }, i18n.__("Create Crypto Wallet").message)
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Crypto Wallet").message, []);
        }

        // // Check balance sufficient or not
        // if (parseFloat(crypto_wallet_data.placed_balance) <= orderQuantity) {
        //   return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Insufficient balance to place order").message, []);
        // }
        // var txnGroupId = Helper.generateTxGroup(user_id);
        var responseData = await module.exports.makeMarketBuyOrder(symbol,
          side,
          order_type,
          orderQuantity,
          user_id,
          res, walletData.crypto.coin_id, walletData.currency.coin_id);

        if (responseData.status > 1) {
          await logger.info({
            "module": "Market Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Success"
          }, i18n.__(responseData.message).message)
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__(responseData.message).message, []);
        } else {
          await logger.info({
            "module": "Market Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Success"
          }, i18n.__('Order Success').message)
          return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__('Order Success').message, []);
        }
      } else if (tradeDataChecking.status == true || tradeDataChecking.status == "true") {
        await logger.info({
          "module": "Market Buy",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Success"
        }, i18n.__('panic button enabled').message)
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__('panic button enabled').message, []);
      } else if (tradeDataChecking.response == false || tradeDataChecking.response == "false") {
        await logger.info({
          "module": "Market Buy",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Success"
        }, i18n.__(tradeDataChecking.msg).message)
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__(tradeDataChecking.msg).message, []);
      }

      // console.log(responseData)
    } catch (err) {
      console.log("err", JSON.stringify(err));
      await logger.info({
        "module": "Market Buy",
        "user_id": "user_" + user_id,
        "url": "Trade Function",
        "type": "Error"
      }, err)
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("server error").message, []);
    }
  }

  // Used for function to make Market Buy order
  async makeMarketBuyOrder(symbol, side, order_type, orderQuantity, user_id, res, crypto_coin_id, currency_coin_id) {
    const checkUser = Helper.checkWhichUser(user_id);
    console.log("checkUser", JSON.stringify(checkUser))
    console.log(JSON.stringify({
      "module": "Market Buy Execution",
      "user_id": "user_" + user_id,
      "url": "Trade Function",
      "type": "Entry"
    }))
    await logger.info({
      "module": "Market Buy Execution",
      "user_id": "user_" + user_id,
      "url": "Trade Function",
      "type": "Entry"
    }, "Entered the function With " + symbol, side, order_type, orderQuantity, user_id, res, crypto_coin_id, currency_coin_id)
    var userIds = [];
    userIds.push(user_id);
    console.log("userIds", JSON.stringify(userIds))
    let { crypto, currency } = await Currency.get_currencies(symbol);
    console.log("crypto, currency", JSON.stringify({ crypto, currency }))
    let wallet = await WalletBalanceHelper.getWalletBalance(crypto, currency, user_id);
    let sellBook = await SellBookHelper.sellOrderBook(crypto, currency);

    if (wallet == 1) {
      var userNotification = await UserNotifications.getSingleData({
        user_id: user_id,
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
                templateSlug: "order_failed",
                email: user_data.email,
                user_detail: user_data,
                formatData: {
                  recipientName: user_data.first_name,
                  reason: i18n.__("Create Currency Wallet").message
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
    } else if (wallet.placed_balance < (sellBook[0].fill_price * sellBook[0].quantity)) {
      var userNotification = await UserNotifications.getSingleData({
        user_id: user_id,
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
                templateSlug: "order_failed",
                email: user_data.email,
                user_detail: user_data,
                formatData: {
                  recipientName: user_data.first_name,
                  reason: i18n.__("Insufficient balance to place order").message
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


    // let fees = await MakerTakerFees.getFeesValue(crypto, currency);
    var quantityFixed = orderQuantity;
    var quantityValue = parseFloat(quantityFixed).toFixed(8);
    var tradeOrder;
    if (sellBook && sellBook.length > 0) {
      console.log("sellBook[0]", JSON.stringify(sellBook[0]))
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
        placed_by: (checkUser ? process.env.TRADEDESK_MANUAL : process.env.TRADEDESK_USER)
      }

      var resultData = {
        ...orderData
      }

      resultData.is_market = true;
      resultData.fix_quantity = quantityValue;
      resultData.maker_fee = 0.0;
      resultData.taker_fee = 0.0;

      var activity = await ActivityHelper.addActivityData(resultData);

      if (quantityValue <= availableQuantity) {
        if (((fillPriceValue * quantityValue).toFixed(8) <= (wallet.placed_balance).toFixed(8)) || orderData.placed_by == process.env.TRADEDESK_MANUAL) {
          var trade_history_data = {
            ...orderData
          };
          trade_history_data.maker_fee = 0;
          trade_history_data.taker_fee = 0;
          trade_history_data.quantity = quantityValue;
          trade_history_data.requested_user_id = currentSellBookDetails.user_id;
          trade_history_data.created_at = now;
          trade_history_data.fix_quantity = quantityValue;
          if (currentSellBookDetails.is_stop_limit == true) {
            trade_history_data.is_stop_limit = true
          }
          let updatedActivity = await ActivityUpdateHelper.updateActivityData(currentSellBookDetails.activity_id, trade_history_data);

          userIds.push(parseInt(trade_history_data.requested_user_id));

          var request = {
            requested_user_id: trade_history_data.requested_user_id,
            user_id: user_id,
            currency: currency,
            side: side,
            settle_currency: crypto,
            quantity: quantityValue,
            fill_price: fillPriceValue,
            crypto_coin_id,
            currency_coin_id
          }

          var tradingFees = await TradingFees.getTraddingFees(request);
          var usd_value = resultData * (request.fill_price * request.quantity);
          trade_history_data.user_fee = (tradingFees.userFee);
          trade_history_data.requested_fee = (tradingFees.requestedFee);
          trade_history_data.user_coin = crypto;
          trade_history_data.requested_coin = currency;
          trade_history_data.maker_fee = tradingFees.maker_fee
          trade_history_data.taker_fee = tradingFees.taker_fee
          trade_history_data.fiat_values = await fiatValueHelper.getFiatValue(crypto, currency);
          // trade_history_data.txn_group_id = txnGroupId;
          let tradeHistory = await TradeAdd.addTradeHistory(trade_history_data);
          tradeOrder = tradeHistory;
          let remainigQuantity = availableQuantity - quantityValue;
          if (remainigQuantity > 0) {
            let updatedSellBook = await sellUpdate.updateSellBook(currentSellBookDetails.id, {
              quantity: remainigQuantity
            });
          } else {
            await sellDelete.deleteSellOrder(currentSellBookDetails.id);
          }
        } else {
          await logger.info({
            "module": "Market Buy Execution",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Entry"
          }, "Insufficient balance to place order");
          return {
            status: 2,
            message: 'Insufficient balance to place order'
          }
        }
      } else {
        var remainingQty = quantityValue - availableQuantity;
        if ((parseFloat(fillPriceValue * quantityValue).toFixed(8) <= parseFloat(wallet.placed_balance).toFixed(8)) || orderData.placed_by == process.env.TRADEDESK_MANUAL) {
          var trade_history_data = {
            ...orderData
          };
          trade_history_data.maker_fee = 0;
          trade_history_data.taker_fee = 0;
          trade_history_data.quantity = availableQuantity;
          trade_history_data.requested_user_id = currentSellBookDetails.user_id;
          trade_history_data.created_at = now;
          trade_history_data.fix_quantity = quantityValue;
          console.log(JSON.stringify(trade_history_data));
          if (currentSellBookDetails.is_stop_limit == true) {
            trade_history_data.is_stop_limit = true
          }
          let updatedActivity = await ActivityUpdateHelper.updateActivityData(currentSellBookDetails.activity_id, trade_history_data);

          userIds.push(parseInt(trade_history_data.requested_user_id));
          var request = {
            requested_user_id: trade_history_data.requested_user_id,
            user_id: user_id,
            currency: currency,
            side: side,
            settle_currency: crypto,
            quantity: availableQuantity,
            fill_price: fillPriceValue,
            crypto_coin_id,
            currency_coin_id
          }
          var tradingFees = await TradingFees.getTraddingFees(request);
          trade_history_data.user_fee = (tradingFees.userFee);
          trade_history_data.requested_fee = (tradingFees.requestedFee);
          trade_history_data.user_coin = crypto;
          trade_history_data.requested_coin = currency;
          trade_history_data.maker_fee = tradingFees.maker_fee
          trade_history_data.taker_fee = tradingFees.taker_fee
          trade_history_data.fiat_values = await fiatValueHelper.getFiatValue(crypto, currency);
          // trade_history_data.txn_group_id = txnGroupId;
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
          await logger.info({
            "module": "Market Buy Execution",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Success"
          }, "Recusrion " + requestData);
          // Again call same api
          let response = await module.exports.makeMarketBuyOrder(requestData.symbol, requestData.side, requestData.order_type, requestData.orderQuantity, requestData.user_id, res, crypto_coin_id, currency_coin_id)
        } else {
          await logger.info({
            "module": "Market Buy Execution",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Success"
          }, "Insufficient balance to place order");
          return {
            status: 2,
            message: 'Insufficient balance to place order'
          }
        }
      }
      // Check for referral
      let referredData = await RefferalHelper.getAmount(tradeOrder, user_id, tradeOrder.id);
    } else {
      await logger.info({
        "module": "Market Buy Execution",
        "user_id": "user_" + user_id,
        "url": "Trade Function",
        "type": "Success"
      }, "Order Book Empty");
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
                  recipientName: user_data.first_name,
                  side: tradeOrder.side,
                  pair: tradeOrder.symbol,
                  order_type: tradeOrder.order_type,
                  quantity: tradeOrder.quantity,
                  price: tradeOrder.fill_price,
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
    await logger.info({
      "module": "Market Buy Execution",
      "user_id": "user_" + user_id,
      "url": "Trade Function",
      "type": "Success"
    }, "Socket Emitted");
    return {
      status: 1,
      message: ''
    }
  }

  // Used to Create Buy Limit order
  async limitBuy(req, res) {
    // var user_id = await Helper.getUserId(req.headers);
    var user_id = await Helper.getUserId(req.headers, res);
    await logger.info({
      "module": "Limit Buy",
      "user_id": "user_" + user_id,
      "url": "Trade Function",
      "type": "Entry"
    }, "Entered the function")
    let {
      symbol,
      side,
      order_type,
      orderQuantity,
      limit_price
    } = req.body;

    let { crypto, currency } = await Currency.get_currencies(symbol);
    var quantityTotal = await sellOrderBookSummary.sellOrderBookSummary(crypto, currency);

    if (quantityTotal.total < orderQuantity) {
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Invalid Quantity").message, []);
    }

    var userData = await Users
      .query()
      .select()
      .first()
      .where("deleted_at", null)
      .andWhere("is_active", true)
      .andWhere("id", user_id)
      .orderBy("id", "DESC");

    var tradeDataChecking = await TradeStatusChecking.tradeStatus(user_id);

    if ((tradeDataChecking.response == true || tradeDataChecking.response == "true" || (userData != undefined && userData.account_tier == 4)) && (tradeDataChecking.status == false || tradeDataChecking.status == "false")) {

      orderQuantity = parseFloat(orderQuantity);

      if (orderQuantity <= 0) {
        await logger.info({
          "module": "Limit Buy",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Succes"
        }, i18n.__("Invalid Quantity").message)
        return Helper.jsonFormat(res, constants.NO_RECORD, i18n.__("Invalid Quantity").message, []);
      }


      if (crypto == currency) {
        await logger.info({
          "module": "Limit Buy",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Succes"
        }, i18n.__("Currency and Crypto should not be same").message)
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Currency and Crypto should not be same").message, []);
      }

      // Get and check Crypto Wallet details
      let walletData = await WalletHelper.checkWalletStatus(crypto, currency, user_id);
      if (!walletData.currency) {
        await logger.info({
          "module": "Limit Buy",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Succes"
        }, i18n.__("Create Currency Wallet").message)
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Currency Wallet").message, []);
      }
      if (!walletData.crypto) {
        await logger.info({
          "module": "Limit Buy",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Succes"
        }, i18n.__("Create Crypto Wallet").message)
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Crypto Wallet").message, []);
      }
      // var txnGroupId = Helper.generateTxGroup(user_id);
      let responseData = await module.exports.limitBuyOrder(symbol,
        user_id,
        side,
        order_type,
        orderQuantity,
        limit_price,
        res,
        false,
        walletData.crypto.coin_id,
        walletData.currency.coin_id,
        // txnGroupId
      );
      console.log("responseData", responseData);
      if (responseData.status > 2) {
        await logger.info({
          "module": "Limit Buy",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Succes"
        }, i18n.__(responseData.message).message)
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__(responseData.message).message, []);
      } else if (responseData.status == 2) {
        await logger.info({
          "module": "Limit Buy",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Succes"
        }, i18n.__(responseData.message).message)
        return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__(responseData.message).message, []);
      }
      else if (responseData.status == 1) {
        await logger.info({
          "module": "Limit Buy",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Succes"
        }, i18n.__(responseData.message).message)
        return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__(responseData.message).message, []);
      }
    } else if (tradeDataChecking.status == true || tradeDataChecking.status == "true") {
      await logger.info({
        "module": "Limit Buy",
        "user_id": "user_" + user_id,
        "url": "Trade Function",
        "type": "Succes"
      }, i18n.__('panic button enabled').message)
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__('panic button enabled').message, []);
    } else if (tradeDataChecking.response == false || tradeDataChecking.response == "false") {
      await logger.info({
        "module": "Limit Buy",
        "user_id": "user_" + user_id,
        "url": "Trade Function",
        "type": "Succes"
      }, i18n.__(tradeDataChecking.msg).message)
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__(tradeDataChecking.msg).message, []);
    }

  }

  // Used to execute Limit Buy Order
  async limitBuyOrder(symbol, user_id, side, order_type, orderQuantity, limit_price, res = null, flag = false, crypto_coin_id = null, currency_coin_id = null) {
    var userIds = [];
    userIds.push(parseInt(user_id));
    await logger.info({
      "module": "Limit Buy",
      "user_id": "user_" + user_id,
      "url": "Trade Function",
      "type": "Entry"
    }, symbol, user_id, side, order_type, orderQuantity, limit_price, res, flag, crypto_coin_id, currency_coin_id)
    const checkUser = Helper.checkWhichUser(user_id);
    let { crypto, currency } = await Currency.get_currencies(symbol);
    let wallet = await WalletBalanceHelper.getWalletBalance(crypto, currency, user_id);
    let sellBook = await SellBookHelper.sellOrderBook(crypto, currency);
    // let fees = await MakerTakerFees.getFeesValue(crypto, currency);
    var now = new Date();
    var quantityValue = parseFloat(orderQuantity).toFixed(8);
    var priceValue = parseFloat(limit_price).toFixed(8);
    var placedBy = "";
    console.log("checkUser", checkUser)
    console.log("flag", flag)
    if (checkUser == true && flag == true) {
      placedBy = process.env.TRADEDESK_BOT
    } else if (checkUser == true) {
      placedBy = process.env.TRADEDESK_MANUAL
    } else {
      placedBy = process.env.TRADEDESK_USER
    }

    if (placedBy != process.env.TRADEDESK_BOT) {
      if (wallet == 1) {
        var userNotification = await UserNotifications.getSingleData({
          user_id: user_id,
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
                  templateSlug: "order_failed",
                  email: user_data.email,
                  user_detail: user_data,
                  formatData: {
                    recipientName: user_data.first_name,
                    reason: i18n.__("Create Currency Wallet").message
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
      } else if (wallet.placed_balance < (sellBook[0].fill_price * sellBook[0].quantity)) {
        var userNotification = await UserNotifications.getSingleData({
          user_id: user_id,
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
                  templateSlug: "order_failed",
                  email: user_data.email,
                  user_detail: user_data,
                  formatData: {
                    recipientName: user_data.first_name,
                    reason: i18n.__("Insufficient balance to place order").message
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
    }

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
      'is_partially_fulfilled': false,
      'placed_by': placedBy
    };

    var resultData = {
      ...buyLimitOrderData
    }
    resultData.is_market = false;
    resultData.fix_quantity = quantityValue

    var activity = await ActivityHelper.addActivityData(resultData);
    resultData.maker_fee = 0.0;
    resultData.taker_fee = 0.0;
    console.log(JSON.stringify(resultData));
    console.log("sellBook.length", JSON.stringify(sellBook))
    // var txnGroupId = Helper.generateTxGroup(user_id);
    if (sellBook && sellBook.length > 0) {
      var currentPrice = sellBook[0].price;
      if (priceValue >= currentPrice) {
        var limitMatchData = await limitMatch.limitData(buyLimitOrderData, crypto, currency, activity, res, crypto_coin_id, currency_coin_id);
        await logger.info({
          "module": "Limit Buy",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Succes"
        }, limitMatchData)
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
        if (total_price <= wallet.placed_balance || placedBy == process.env.TRADEDESK_BOT || placedBy == process.env.TRADEDESK_MANUAL) {
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
                    console.log("======Order placed");
                    var allData = {
                      template: "emails/general_mail.ejs",
                      templateSlug: "trade_place",
                      email: user_data.email,
                      user_detail: user_data,
                      formatData: {
                        recipientName: user_data.first_name,
                        side: buyLimitOrderData.side,
                        pair: buyLimitOrderData.symbol,
                        order_type: buyLimitOrderData.order_type,
                        quantity: buyLimitOrderData.quantity,
                        price: buyLimitOrderData.limit_price,
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
          await logger.info({
            "module": "Limit Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Succes"
          }, "Socket Emiiter with message Order Palce Success")
          return {
            status: 2,
            message: 'Order Palce Success'
          }
        } else {
          await logger.info({
            "module": "Limit Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Succes"
          }, "Insufficient balance to place order")
          return {
            status: 3,
            message: 'Insufficient balance to place order'
          }
        }
      }
    } else {
      buyLimitOrderData.activity_id = activity.id;
      var total_price = parseFloat(buyLimitOrderData.quantity * buyLimitOrderData.limit_price).toFixed(8);
      if (total_price <= wallet.placed_balance || placedBy == process.env.TRADEDESK_BOT || placedBy == process.env.TRADEDESK_MANUAL) {
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
                  console.log("========Order placed");
                  var allData = {
                    template: "emails/general_mail.ejs",
                    templateSlug: "trade_place",
                    email: user_data.email,
                    user_detail: user_data,
                    formatData: {
                      recipientName: user_data.first_name,
                      side: buyLimitOrderData.side,
                      pair: buyLimitOrderData.symbol,
                      order_type: buyLimitOrderData.order_type,
                      quantity: buyLimitOrderData.quantity,
                      price: buyLimitOrderData.limit_price,
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
        await logger.info({
          "module": "Limit Buy",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Succes"
        }, "Socket Emiiter with message Order Palce Success")
        return {
          status: 2,
          message: 'Order Palce Success'
        }
      } else {
        await logger.info({
          "module": "Limit Buy",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Succes"
        }, "Insufficient balance to place order")
        return {
          status: 3,
          message: 'Insufficient balance to place order'
        }
      }
    }
  }

  // Used to create Sell Limit Order
  async limitSell(req, res) {
    var user_id = await Helper.getUserId(req.headers, res);
    await logger.info({
      "module": "Limit Sell",
      "user_id": "user_" + user_id,
      "url": "Trade Function",
      "type": "Entry"
    }, "Entered the function")
    let {
      symbol,
      // user_id,
      side,
      order_type,
      orderQuantity,
      limit_price
    } = req.body;

    let { crypto, currency } = await Currency.get_currencies(symbol);

    var quantityTotal = await buyOrderBookSummary.getBuyBookOrderSummary(crypto, currency);

    if (quantityTotal.total_quantity < orderQuantity) {
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Invalid Quantity").message, []);
    }

    var userData = await Users
      .query()
      .select()
      .first()
      .where("deleted_at", null)
      .andWhere("is_active", true)
      .andWhere("id", user_id)
      .orderBy("id", "DESC");
    var tradeDataChecking = await TradeStatusChecking.tradeStatus(user_id);

    if ((tradeDataChecking.response == true || tradeDataChecking.response == "true" || (userData != undefined && userData.account_tier == 4)) && (tradeDataChecking.status == false || tradeDataChecking.status == "false")) {

      orderQuantity = parseFloat(orderQuantity);

      if (orderQuantity <= 0) {
        await logger.info({
          "module": "Limit Sell",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Succes"
        }, i18n.__("Invalid Quantity").message)
        return Helper.jsonFormat(res, constants.NO_RECORD, i18n.__("Invalid Quantity").message, []);
      }


      if (crypto == currency) {
        await logger.info({
          "module": "Limit Sell",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Succes"
        }, i18n.__("Currency and Crypto should not be same").message)
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Currency and Crypto should not be same").message, []);
      }
      // Get and check Crypto Wallet details
      // Get and check Crypto Wallet details
      let walletData = await WalletHelper.checkWalletStatus(crypto, currency, user_id);
      if (!walletData.currency) {
        await logger.info({
          "module": "Limit Sell",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Succes"
        }, i18n.__("Create Currency Wallet").message)
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Currency Wallet").message, []);
      }
      if (!walletData.crypto) {
        await logger.info({
          "module": "Limit Sell",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Succes"
        }, i18n.__("Create Crypto Wallet").message)
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Crypto Wallet").message, []);
      }

      const checkUser = Helper.checkWhichUser(user_id);

      if ((parseFloat(walletData.crypto.placed_balance) <= orderQuantity) && checkUser != true) {
        await logger.info({
          "module": "Limit Sell",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Succes"
        }, i18n.__("Insufficient balance to place order").message)
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Insufficient balance to place order").message, []);
      }
      // var txnGroupId = Helper.generateTxGroup(user_id);
      let responseData = await module.exports.limitSellOrder(symbol,
        user_id,
        side,
        order_type,
        orderQuantity,
        limit_price,
        res,
        false,
        walletData.crypto.coin_id,
        walletData.currency.coin_id
        // txnGroupId
      );

      if (responseData.status > 2) {
        await logger.info({
          "module": "Limit Sell",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Succes"
        }, i18n.__(responseData.message).message)
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__(responseData.message).message, []);
      } else if (responseData.status == 2) {
        await logger.info({
          "module": "Limit Sell",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Succes"
        }, i18n.__(responseData.message).message)
        return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__(responseData.message).message, []);
      }
      else if (responseData.status == 1) {
        await logger.info({
          "module": "Limit Sell",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Succes"
        }, i18n.__(responseData.message).message)
        return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__(responseData.message).message, []);
      }
    } else if (tradeDataChecking.status == true || tradeDataChecking.status == "true") {
      await logger.info({
        "module": "Limit Sell",
        "user_id": "user_" + user_id,
        "url": "Trade Function",
        "type": "Succes"
      }, i18n.__('panic button enabled').message)
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__('panic button enabled').message, []);
    } else if (tradeDataChecking.response == false || tradeDataChecking.response == "false") {
      await logger.info({
        "module": "Limit Sell",
        "user_id": "user_" + user_id,
        "url": "Trade Function",
        "type": "Succes"
      }, i18n.__(tradeDataChecking.msg).message)
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__(tradeDataChecking.msg).message, []);
    }
  }

  // Used to execute Limit Sell Order
  async limitSellOrder(symbol, user_id, side, order_type, orderQuantity, limit_price, res = null, flag = false, crypto_coin_id, currency_coin_id) {
    var userIds = [];
    userIds.push(parseInt(user_id));
    await logger.info({
      "module": "Limit Sell Execution",
      "user_id": "user_" + user_id,
      "url": "Trade Function",
      "type": "Entry"
    }, "Entered the function " + symbol, user_id, side, order_type, orderQuantity, limit_price, res, flag, crypto_coin_id, currency_coin_id)
    const checkUser = Helper.checkWhichUser(user_id);
    let { crypto, currency } = await Currency.get_currencies(symbol);
    let wallet = await SellWalletBalanceHelper.getSellWalletBalance(crypto, currency, user_id);
    let buyBook = await BuyBookHelper.getBuyBookOrder(crypto, currency);
    // let fees = await MakerTakerFees.getFeesValue(crypto, currency);
    var now = new Date();
    var quantityValue = parseFloat(orderQuantity).toFixed(8);
    var priceValue = parseFloat(limit_price).toFixed(8);
    var placedBy = "";
    console.log("checkUser", checkUser)
    console.log("flag", flag)
    if (checkUser == true && flag == true) {
      placedBy = process.env.TRADEDESK_BOT
    } else if (checkUser == true) {
      placedBy = process.env.TRADEDESK_MANUAL
    } else {
      placedBy = process.env.TRADEDESK_USER
    }

    if (placedBy != process.env.TRADEDESK_BOT) {
      if (wallet == 1) {
        var userNotification = await UserNotifications.getSingleData({
          user_id: user_id,
          deleted_at: null,
          slug: 'trade_execute'
        })
        var user_data = await Users.getSingleData({
          deleted_at: null,
          id: user_id,
          is_active: true
        });
        if (user_data != undefined) {
          if (userNotification != undefined) {
            if (userNotification.email == true || userNotification.email == "true") {
              if (user_data.email != undefined) {
                var allData = {
                  template: "emails/general_mail.ejs",
                  templateSlug: "order_failed",
                  email: user_data.email,
                  user_detail: user_data,
                  formatData: {
                    recipientName: user_data.first_name,
                    reason: i18n.__("Create Currency Wallet").message
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
        return 1
      } else if (wallet.placed_balance < (orderQuantity)) {
        var userNotification = await UserNotifications.getSingleData({
          user_id: user_id,
          deleted_at: null,
          slug: 'trade_execute'
        })
        var user_data = await Users.getSingleData({
          deleted_at: null,
          id: user_id,
          is_active: true
        });
        if (user_data != undefined) {
          if (userNotification != undefined) {
            if (userNotification.email == true || userNotification.email == "true") {
              if (user_data.email != undefined) {
                var allData = {
                  template: "emails/general_mail.ejs",
                  templateSlug: "order_failed",
                  email: user_data.email,
                  user_detail: user_data,
                  formatData: {
                    recipientName: user_data.first_name,
                    reason: i18n.__("Insufficient balance to place order").message
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
        return 1
      }
    }

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
      'is_partially_fulfilled': false,
      'placed_by': placedBy
    }

    var resultData = {
      ...sellLimitOrderData
    };
    resultData.is_market = false;
    resultData.fix_quantity = quantityValue;

    var activity = await ActivityHelper.addActivityData(resultData);
    resultData.maker_fee = 0.0;
    resultData.taker_fee = 0.0;
    console.log(JSON.stringify(resultData));

    if (buyBook && buyBook.length > 0) {
      var currentPrice = buyBook[0].price;
      if (priceValue <= currentPrice) {
        console.log("INSIDE IF")
        var limitSellMatchData = await limitSellMatch.limitSellData(sellLimitOrderData, crypto, currency, activity, res, crypto_coin_id, currency_coin_id);
        await logger.info({
          "module": "Limit Sell Execution",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Succes"
        }, limitSellMatchData)
        return {
          status: limitSellMatchData.status,
          message: limitSellMatchData.message
        };
      } else {
        sellLimitOrderData.activity_id = activity.id;
        // console.log("wallet", wallet)
        sellLimitOrderData.is_partially_fulfilled = true;
        sellLimitOrderData.is_filled = false;
        sellLimitOrderData.added = true;
        var addSellBook = await SellAdd.SellOrderAdd(sellLimitOrderData, crypto_coin_id);
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
                    templateSlug: "trade_place",
                    email: user_data.email,
                    user_detail: user_data,
                    formatData: {
                      recipientName: user_data.first_name,
                      side: sellLimitOrderData.side,
                      pair: sellLimitOrderData.symbol,
                      order_type: sellLimitOrderData.order_type,
                      quantity: sellLimitOrderData.quantity,
                      price: sellLimitOrderData.limit_price,
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
        await logger.info({
          "module": "Limit Sell Execution",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Succes"
        }, "Socket Execution with Order Palce Success")
        return {
          status: 2,
          message: 'Order Palce Success'
        }
      }
    } else {
      sellLimitOrderData.activity_id = activity.id;
      sellLimitOrderData.is_partially_fulfilled = true;
      sellLimitOrderData.is_filled = false;
      sellLimitOrderData.added = true;
      var addSellBook = await SellAdd.SellOrderAdd(sellLimitOrderData, crypto_coin_id);
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
                  templateSlug: "trade_place",
                  email: user_data.email,
                  user_detail: user_data,
                  formatData: {
                    recipientName: user_data.first_name,
                    side: sellLimitOrderData.side,
                    pair: sellLimitOrderData.symbol,
                    order_type: sellLimitOrderData.order_type,
                    quantity: sellLimitOrderData.quantity,
                    price: sellLimitOrderData.limit_price,
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
      await logger.info({
        "module": "Limit Sell Execution",
        "user_id": "user_" + user_id,
        "url": "Trade Function",
        "type": "Succes"
      }, "Socket Execution with Order Palce Success")
      return {
        status: 2,
        message: 'Order Palce Success'
      }
    }
  }

  // Create Stop Limit Buy Order
  async stopLimitBuyOrder(req, res) {
    // var user_id = await Helper.getUserId(req.headers);
    var user_id = await Helper.getUserId(req.headers, res);
    await logger.info({
      "module": "Stop Limit Buy",
      "user_id": "user_" + user_id,
      "url": "Trade Function",
      "type": "Entry"
    }, "Entered the function")
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
      var userData = await Users
        .query()
        .select()
        .first()
        .where("deleted_at", null)
        .andWhere("is_active", true)
        .andWhere("id", user_id)
        .orderBy("id", "DESC");
      var tradeDataChecking = await TradeStatusChecking.tradeStatus(user_id);

      if ((tradeDataChecking.response == true || tradeDataChecking.response == "true" || (userData != undefined && userData.account_tier == 4)) && (tradeDataChecking.status == false || tradeDataChecking.status == "false")) {

        console.log(JSON.stringify(req.body))

        if (orderQuantity <= 0) {
          await logger.info({
            "module": "Stop Limit Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Succes"
          }, i18n.__("Invalid Quantity").message)
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Invalid Quantity").message, []);
        }
        let { crypto, currency } = await Currency.get_currencies(symbol);

        if (crypto == currency) {
          await logger.info({
            "module": "Stop Limit Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Succes"
          }, i18n.__("Currency and Crypto should not be same").message)
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Currency and Crypto should not be same").message, []);
        }
        let wallet = await SellWalletBalanceHelper.getSellWalletBalance(crypto, currency, user_id);

        if (wallet == 1) {
          await logger.info({
            "module": "Stop Limit Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Succes"
          }, i18n.__("Create Crypto Wallet").message)
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Crypto Wallet").message, []);
        }

        let wallet1 = await SellWalletBalanceHelper.getSellWalletBalance(currency, crypto, user_id);

        if (wallet == 1) {
          await logger.info({
            "module": "Stop Limit Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Succes"
          }, i18n.__("Create Currency Wallet").message)
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Currency Wallet").message, []);
        }
        // console.log(wallet)
        if (wallet == 0) {
          await logger.info({
            "module": "Stop Limit Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Succes"
          }, i18n.__("Coin not found").message)
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

        console.log("walletCurrency", JSON.stringify(walletCurrency))

        if (walletCurrency == undefined) {
          await logger.info({
            "module": "Stop Limit Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Succes"
          }, i18n.__("Create Currency Wallet").message)
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

        console.log("walletCrypto", JSON.stringify(walletCrypto))

        if (walletCrypto == undefined) {
          await logger.info({
            "module": "Stop Limit Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Succes"
          }, i18n.__("Create Crypto Wallet").message)
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Crypto Wallet").message, []);
        }

        // Add Geofencing over here
        var stop_limit_sell_response = await StopLimitBuyAdd.stopBuyAdd(symbol, user_id, side, order_type, orderQuantity, limit_price, stop_price, res);
        console.log("stop_limit_sell_response", JSON.stringify(stop_limit_sell_response))
        if (stop_limit_sell_response.status > 1) {
          await logger.info({
            "module": "Stop Limit Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Succes"
          }, i18n.__(stop_limit_sell_response.message).message)
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__(stop_limit_sell_response.message).message, []);
        } else {
          await logger.info({
            "module": "Stop Limit Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Succes"
          }, i18n.__("Order Palce Success").message)
          return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("Order Palce Success").message, []);
        }
      } else if (tradeDataChecking.status == true || tradeDataChecking.status == "true") {
        await logger.info({
          "module": "Stop Limit Buy",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Succes"
        }, i18n.__('panic button enabled').message)
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__('panic button enabled').message, []);
      } else if (tradeDataChecking.response == false || tradeDataChecking.response == "false") {
        await logger.info({
          "module": "Stop Limit Buy",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Succes"
        }, i18n.__(tradeDataChecking.msg).message)
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__(tradeDataChecking.msg).message, []);
      }
    } catch (error) {
      console.log(JSON.stringify(error));
      await logger.info({
        "module": "Stop Limit Buy",
        "user_id": "user_" + user_id,
        "url": "Trade Function",
        "type": "Error"
      }, error)
    }
  }

  // Create Stop Limit Sell Order
  async stopLimitSellOrder(req, res) {
    try {
      // var user_id = await Helper.getUserId(req.headers);
      var user_id = await Helper.getUserId(req.headers, res);
      await logger.info({
        "module": "Stop Limit Sell",
        "user_id": "user_" + user_id,
        "url": "Trade Function",
        "type": "Entry"
      }, "Entered the function")
      var {
        symbol,
        side,
        order_type,
        orderQuantity,
        limit_price,
        stop_price
        // user_id
      } = req.body;
      var userData = await Users
        .query()
        .select()
        .first()
        .where("deleted_at", null)
        .andWhere("is_active", true)
        .andWhere("id", user_id)
        .orderBy("id", "DESC");
      var tradeDataChecking = await TradeStatusChecking.tradeStatus(user_id);

      if ((tradeDataChecking.response == true || tradeDataChecking.response == "true" || (userData != undefined && userData.account_tier == 4)) && (tradeDataChecking.status == false || tradeDataChecking.status == "false")) {

        console.log("req.body", JSON.stringify(req.body))

        if (orderQuantity <= 0) {
          await logger.info({
            "module": "Stop Limit Sell",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Success"
          }, i18n.__("Invalid Quantity").message)
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Invalid Quantity").message, []);
        }

        let { crypto, currency } = await Currency.get_currencies(symbol);

        if (crypto == currency) {
          await logger.info({
            "module": "Stop Limit Sell",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Success"
          }, i18n.__("Currency and Crypto should not be same").message)
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Currency and Crypto should not be same").message, []);
        }

        let wallet = await WalletBalanceHelper.getWalletBalance(crypto, currency, user_id);
        if (wallet == 1) {
          await logger.info({
            "module": "Stop Limit Sell",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Success"
          }, i18n.__("Create Currency Wallet").message)
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Currency Wallet").message, []);
        }
        let crypto_wallet_data_crypto1 = await WalletBalanceHelper.getWalletBalance(currency, crypto, user_id);
        if (crypto_wallet_data_crypto1 == 1) {
          await logger.info({
            "module": "Stop Limit Sell",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Success"
          }, i18n.__("Create Crypto Wallet").message)
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Crypto Wallet").message, []);
        }

        if (wallet == 0) {
          await logger.info({
            "module": "Stop Limit Sell",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Success"
          }, i18n.__("Coin not found").message)
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

        console.log("walletCurrency", JSON.stringify(walletCurrency))

        if (walletCurrency == undefined) {
          await logger.info({
            "module": "Stop Limit Sell",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Success"
          }, i18n.__("Create Currency Wallet").message)
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

        console.log("walletCrypto", JSON.stringify(walletCrypto))

        if (walletCrypto == undefined) {
          await logger.info({
            "module": "Stop Limit Sell",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Success"
          }, i18n.__("Create Crypto Wallet").message)
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Crypto Wallet").message, []);
        }

        // Add Geofencing over here
        var stop_limit_buy_response = await StopLimitAdd.stopSellAdd(symbol, user_id, side, order_type, orderQuantity, limit_price, stop_price, res);

        console.log("stop_limit_buy_response", JSON.stringify(stop_limit_buy_response))

        if (stop_limit_buy_response.status > 1) {
          await logger.info({
            "module": "Stop Limit Sell",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Success"
          }, i18n.__(stop_limit_buy_response.message).message)
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__(stop_limit_buy_response.message).message, []);
        } else {
          await logger.info({
            "module": "Stop Limit Sell",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Success"
          }, i18n.__("Order Palce Success").message)
          return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("Order Palce Success").message, []);
        }
      } else if (tradeDataChecking.status == true || tradeDataChecking.status == "true") {
        await logger.info({
          "module": "Stop Limit Sell",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Success"
        }, i18n.__('panic button enabled').message)
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__('panic button enabled').message, []);
      } else if (tradeDataChecking.response == false || tradeDataChecking.response == "false") {
        await logger.info({
          "module": "Stop Limit Sell",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Success"
        }, i18n.__(tradeDataChecking.msg).message)
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__(tradeDataChecking.msg).message, []);
      }

    } catch (error) {
      console.log(JSON.stringify(error));
      await logger.info({
        "module": "Stop Limit Sell",
        "user_id": "user_" + user_id,
        "url": "Trade Function",
        "type": "Error"
      }, error)
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

      console.log("pendingOrderBook", JSON.stringify(pendingOrderBook))

      if (pendingData.length > 0) {
        if (order_type == "StopLimit" && side == "Buy") {
          console.log("INSIDE BUY")
          var pendigBuy = await StopLimitBuyExecute.stopLimitBuy(now, pendingOrderBook);
        } else if (order_type == "StopLimit" && side == "Sell") {
          console.log("INSIDE SELL", JSON.stringify(pendingOrderBook))
          var pendingSell = await StopLimitSellExecute.stopLimitSell(now, pendingOrderBook);
        }
      }
    }
  }

  async cancelPendingOrder(req, res) {
    try {
      await logger.info({
        "module": "Cancel PEnding Order",
        "user_id": "user_" + req.body.user_id,
        "url": "Trade Function",
        "type": "Entry"
      }, "Entered the function")
      var { side, id, order_type, user_id } = req.body;
      console.log(JSON.stringify(req.body));
      var cancel_pending_data = await cancelPendingHelper.cancelPendingOrder(side, order_type, id);
      console.log("cancel_pending_data", JSON.stringify(cancel_pending_data))
      if (cancel_pending_data == 0) {
        await logger.info({
          "module": "Cancel PEnding Order",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Success"
        }, i18n.__("No Buy Data Found").message)
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("No Buy Data Found").message, []);
      } else if (cancel_pending_data == 1) {
        await logger.info({
          "module": "Cancel PEnding Order",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Success"
        }, i18n.__("No Sell Data Found").message)
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("No Sell Data Found").message, []);
      } else if (cancel_pending_data == 3) {
        await logger.info({
          "module": "Cancel PEnding Order",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Success"
        }, i18n.__("No Pending Data Found").message)
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("No Pending Data Found").message, []);
      } else if (cancel_pending_data == 4) {
        await logger.info({
          "module": "Cancel PEnding Order",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Success"
        }, i18n.__("Order Cancelled").message)
        return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("Order Cancelled").message, []);
      } else if (cancel_pending_data == 5) {
        await logger.info({
          "module": "Cancel PEnding Order",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Success"
        }, i18n.__("server error").message)
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("server error").message, []);
      }
    } catch (error) {
      console.log(JSON.stringify(error));
      await logger.info({
        "module": "Cancel PEnding Order",
        "user_id": "user_" + user_id,
        "url": "Trade Function",
        "type": "Error"
      }, error)
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("server error").message, []);
    }
  }

  // Get Users Completed Orders details
  async getUserOrdersData(req, res, next) {
    var user_id = await Helper.getUserId(req.headers, res);
    console.log('params', req.query);
    let { pair, limit, page, month, action, fromDate, toDate } = req.query;
    pair = (pair).split("-");
    var crypto = pair[0];
    var currency = pair[1];
    let allData;
    if (action == 1) {
      let helper = require("../../helpers/tradding/get-completed-orders");
      allData = await helper.getUserCompletedOrders(user_id, crypto, currency, limit, page, fromDate, toDate);
    } else if (action == 2) {
      let helper = require("../../helpers/tradding/get-pending-orders");
      allData = await helper.getUserPendingOrders(user_id, crypto, currency, limit, page, fromDate, toDate);
    } else if (action == 3) {
      let helper = require("../../helpers/tradding/get-cancelled-orders");
      allData = await helper.getUserCancelledOrders(user_id, crypto, currency, limit, page, fromDate, toDate);
    }
    return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("Trade retrieve success").message, allData);
  }

  // Queue Market Buy Order
  async marketBuyQueue(req, res) {

    try {
      var user_id = await Helper.getUserId(req.headers, res);
      await logger.info({
        "module": "Market Buy",
        "user_id": "user_" + user_id,
        "url": "Trade Function",
        "type": "Entry"
      }, "Entered the function")
      let {
        symbol,
        side,
        order_type,
        orderQuantity,
      } = req.body;
      // var user_id = await Helper.getUserId(req.headers, res);

      let { crypto, currency } = await Currency.get_currencies(symbol);

      var quantityTotal = await sellOrderBookSummary.sellOrderBookSummary(crypto, currency);

      if (quantityTotal.total < orderQuantity) {
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Invalid Quantity").message, []);
      }

      var userIds = [];
      userIds.push(user_id);

      var userData = await Users
        .query()
        .select()
        .first()
        .where("deleted_at", null)
        .andWhere("is_active", true)
        .andWhere("id", user_id)
        .orderBy("id", "DESC");

      var tradeDataChecking = await TradeStatusChecking.tradeStatus(user_id);

      if ((tradeDataChecking.response == true || tradeDataChecking.response == "true" || (userData != undefined && userData.account_tier == 4)) && (tradeDataChecking.status == false || tradeDataChecking.status == "false")) {

        orderQuantity = parseFloat(orderQuantity);

        if (orderQuantity <= 0) {
          await logger.info({
            "module": "Market Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Entry"
          }, i18n.__("Invalid Quantity").message);
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Invalid Quantity").message, []);
        }

        // Get Currency/Crypto each asset

        if (crypto == currency) {
          await logger.info({
            "module": "Market Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Entry"
          }, i18n.__("Currency and Crypto should not be same").message)
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Currency and Crypto should not be same").message, []);
        }
        // Get and check Crypto Wallet details
        let walletData = await WalletHelper.checkWalletStatus(crypto, currency, user_id);
        if (!walletData.currency) {
          await logger.info({
            "module": "Market Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Entry"
          }, i18n.__("Create Currency Wallet").message)
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Currency Wallet").message, []);
        }
        if (!walletData.crypto) {
          await logger.info({
            "module": "Market Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Entry"
          }, i18n.__("Create Crypto Wallet").message)
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Crypto Wallet").message, []);
        }

        var queueName = process.env.QUEUE_NAME
        var queueData = {
          symbol,
          side,
          order_type,
          orderQuantity,
          user_id,
          res: null,
          crypto: walletData.crypto.coin_id,
          currency: walletData.currency.coin_id
        }
        var responseValue = await QueueValue.publishToQueue(queueName, queueData)
        if (responseValue == 0) {
          await logger.info({
            "module": "Market Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Success"
          }, i18n.__('Order Success').message)
          return Helper.jsonFormat(res, constants.SUCCESS_CODE, "Your order is successfully placed.", []);
        } else {
          await logger.info({
            "module": "Market Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Error"
          })
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("server error").message, []);
        }

      } else if (tradeDataChecking.status == true || tradeDataChecking.status == "true") {
        await logger.info({
          "module": "Market Buy",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Success"
        }, i18n.__('panic button enabled').message)
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__('panic button enabled').message, []);
      } else if (tradeDataChecking.response == false || tradeDataChecking.response == "false") {
        await logger.info({
          "module": "Market Buy",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Success"
        }, i18n.__(tradeDataChecking.msg).message)
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__(tradeDataChecking.msg).message, []);
      }

      // console.log(responseData)
    } catch (err) {
      console.log("err", JSON.stringify(err));
      await logger.info({
        "module": "Market Buy",
        "user_id": "user_" + user_id,
        "url": "Trade Function",
        "type": "Error"
      }, err)
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("server error").message, []);
    }
  }

  // Queue Market Sell Order
  async marketSellQueue(req, res) {
    try {
      var user_id = await Helper.getUserId(req.headers, res);
      await logger.info({
        "module": "Market Sell",
        "user_id": "user_" + user_id,
        "url": "Trade Function",
        "type": "Entry"
      }, "Entered the function")
      let {
        symbol,
        side,
        order_type,
        orderQuantity,
        // user_id
      } = req.body;
      console.log("req.body", req.body)
      let { crypto, currency } = await Currency.get_currencies(symbol);

      var quantityTotal = await buyOrderBookSummary.getBuyBookOrderSummary(crypto, currency);

      // if (quantityTotal.total_quantity < orderQuantity) {
      //   return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Invalid Quantity").message, []);
      // }
      // get user id from header
      let userIds = [];
      userIds.push(user_id);

      var userData = await Users
        .query()
        .select()
        .first()
        .where("deleted_at", null)
        .andWhere("is_active", true)
        .andWhere("id", user_id)
        .orderBy("id", "DESC");

      // Check user user is allowed to trade or not
      var tradeDataChecking = await TradeStatusChecking.tradeStatus(user_id);

      console.log("tradeDataChecking", tradeDataChecking)

      if ((tradeDataChecking.response == true || tradeDataChecking.response == "true" || (userData != undefined && userData.account_tier == 4)) && (tradeDataChecking.status == false || tradeDataChecking.status == "false")) {
        // console.log("INSIDE IF")
        orderQuantity = parseFloat(orderQuantity);

        // Order Quantity Validation
        if (orderQuantity <= 0) {
          await logger.info({
            "module": "Market Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Success"
          }, i18n.__("Invalid Quantity").message);
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Invalid Quantity").message, []);
        }

        // Get Currency/Crypto each asset

        if (crypto == currency) {
          await logger.info({
            "module": "Market Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Success"
          }, i18n.__("Currency and Crypto should not be same").message);
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Currency and Crypto should not be same").message, []);
        }

        // Get and check Crypto Wallet details
        let walletData = await WalletHelper.checkWalletStatus(crypto, currency, user_id);
        if (!walletData.currency) {
          await logger.info({
            "module": "Market Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Success"
          }, i18n.__("Create Currency Wallet").message);
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Currency Wallet").message, []);
        }
        if (!walletData.crypto) {
          await logger.info({
            "module": "Market Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Success"
          }, i18n.__("Create Crypto Wallet").message);
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Crypto Wallet").message, []);
        }
        const checkUser = Helper.checkWhichUser(user_id);

        // Check balance sufficient or not
        console.log("crypto_wallet_data.placed_balance", JSON.stringify(walletData.crypto.placed_balance))
        if ((parseFloat(walletData.crypto.placed_balance) <= orderQuantity) && checkUser != true) {
          await logger.info({
            "module": "Market Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Success"
          }, i18n.__("Insufficient balance to place order").message);
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
          crypto_wallet_data: walletData.crypto,
          userIds: userIds
        };

        console.log("object", object)

        var queueName = process.env.QUEUE_NAME
        var queueData = {
          object,
          user_id,
          order_type: order_type,
          side: side,
          res: null,
          crypto: walletData.crypto.coin_id,
          currency: walletData.currency.coin_id
        }
        console.log("queueData", queueData)
        var responseValue = await QueueValue.publishToQueue(queueName, queueData)

        if (responseValue == 0) {
          await logger.info({
            "module": "Market Buy",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Success"
          }, i18n.__('Order Success').message)
          return Helper.jsonFormat(res, constants.SUCCESS_CODE, "Your order is successfully placed.", []);
        } else {
          await logger.error({
            "module": "Market Sell",
            "user_id": "user_" + user_id,
            "url": "Trade Function",
            "type": "Error"
          })
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("server error").message, []);
        }
      } else if (tradeDataChecking.status == true || tradeDataChecking.status == "true") {
        await logger.info({
          "module": "Market Buy",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Success"
        }, i18n.__('panic button enabled').message);
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__('panic button enabled').message, []);
      } else if (tradeDataChecking.response == false || tradeDataChecking.response == "false") {
        await logger.info({
          "module": "Market Buy",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Success"
        }, i18n.__(tradeDataChecking.msg).message);
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__(tradeDataChecking.msg).message, []);
      }


    } catch (err) {
      console.log("err", JSON.stringify(err));
      await logger.error({
        "module": "Market Sell",
        "user_id": "user_" + user_id,
        "url": "Trade Function",
        "type": "Error"
      }, err)
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("server error").message, []);
    }
  }

  // Queue limit Buy Order
  async limitBuyOrderQueue(req, res) {
    // var user_id = await Helper.getUserId(req.headers);
    var user_id = await Helper.getUserId(req.headers, res);
    await logger.info({
      "module": "Limit Buy",
      "user_id": "user_" + user_id,
      "url": "Trade Function",
      "type": "Entry"
    }, "Entered the function")
    let {
      symbol,
      side,
      order_type,
      orderQuantity,
      limit_price
    } = req.body;
    let { crypto, currency } = await Currency.get_currencies(symbol);

    var quantityTotal = await sellOrderBookSummary.sellOrderBookSummary(crypto, currency);

    if (quantityTotal.total < orderQuantity) {
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Invalid Quantity").message, []);
    }

    var userData = await Users
      .query()
      .select()
      .first()
      .where("deleted_at", null)
      .andWhere("is_active", true)
      .andWhere("id", user_id)
      .orderBy("id", "DESC");

    var tradeDataChecking = await TradeStatusChecking.tradeStatus(user_id);

    if ((tradeDataChecking.response == true || tradeDataChecking.response == "true" || (userData != undefined && userData.account_tier == 4)) && (tradeDataChecking.status == false || tradeDataChecking.status == "false")) {

      orderQuantity = parseFloat(orderQuantity);

      if (orderQuantity <= 0) {
        await logger.info({
          "module": "Limit Buy",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Succes"
        }, i18n.__("Invalid Quantity").message)
        return Helper.jsonFormat(res, constants.NO_RECORD, i18n.__("Invalid Quantity").message, []);
      }


      if (crypto == currency) {
        await logger.info({
          "module": "Limit Buy",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Succes"
        }, i18n.__("Currency and Crypto should not be same").message)
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Currency and Crypto should not be same").message, []);
      }

      // Get and check Crypto Wallet details
      let walletData = await WalletHelper.checkWalletStatus(crypto, currency, user_id);
      if (!walletData.currency) {
        await logger.info({
          "module": "Limit Buy",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Succes"
        }, i18n.__("Create Currency Wallet").message)
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Currency Wallet").message, []);
      }
      if (!walletData.crypto) {
        await logger.info({
          "module": "Limit Buy",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Succes"
        }, i18n.__("Create Crypto Wallet").message)
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Crypto Wallet").message, []);
      }

      var queueName = process.env.QUEUE_NAME
      var queueData = {
        symbol,
        user_id,
        side,
        order_type,
        orderQuantity,
        limit_price,
        res: null,
        flag: false,
        crypto: walletData.crypto.coin_id,
        currency: walletData.currency.coin_id
      }
      var responseValue = await QueueValue.publishToQueue(queueName, queueData)

      if (responseValue == 0) {
        await logger.info({
          "module": "Market Buy",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Success"
        }, i18n.__('Order Success').message)
        return Helper.jsonFormat(res, constants.SUCCESS_CODE, "Your order is successfully placed.", []);
      } else {
        await logger.info({
          "module": "Market Buy",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Error"
        })
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("server error").message, []);
      }
    } else if (tradeDataChecking.status == true || tradeDataChecking.status == "true") {
      await logger.info({
        "module": "Limit Buy",
        "user_id": "user_" + user_id,
        "url": "Trade Function",
        "type": "Succes"
      }, i18n.__('panic button enabled').message)
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__('panic button enabled').message, []);
    } else if (tradeDataChecking.response == false || tradeDataChecking.response == "false") {
      await logger.info({
        "module": "Limit Buy",
        "user_id": "user_" + user_id,
        "url": "Trade Function",
        "type": "Succes"
      }, i18n.__(tradeDataChecking.msg).message)
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__(tradeDataChecking.msg).message, []);
    }

  }

  // Used to create Sell Limit Order
  async limitSellOrderQueue(req, res) {
    var user_id = await Helper.getUserId(req.headers, res);
    await logger.info({
      "module": "Limit Sell",
      "user_id": "user_" + user_id,
      "url": "Trade Function",
      "type": "Entry"
    }, "Entered the function")
    let {
      symbol,
      side,
      order_type,
      orderQuantity,
      limit_price
    } = req.body;

    let { crypto, currency } = await Currency.get_currencies(symbol);

    var quantityTotal = await buyOrderBookSummary.getBuyBookOrderSummary(crypto, currency);

    if (quantityTotal.total_quantity < orderQuantity) {
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Invalid Quantity").message, []);
    }

    var userData = await Users
      .query()
      .select()
      .first()
      .where("deleted_at", null)
      .andWhere("is_active", true)
      .andWhere("id", user_id)
      .orderBy("id", "DESC");
    var tradeDataChecking = await TradeStatusChecking.tradeStatus(user_id);

    if ((tradeDataChecking.response == true || tradeDataChecking.response == "true" || (userData != undefined && userData.account_tier == 4)) && (tradeDataChecking.status == false || tradeDataChecking.status == "false")) {

      orderQuantity = parseFloat(orderQuantity);

      if (orderQuantity <= 0) {
        await logger.info({
          "module": "Limit Sell",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Succes"
        }, i18n.__("Invalid Quantity").message)
        return Helper.jsonFormat(res, constants.NO_RECORD, i18n.__("Invalid Quantity").message, []);
      }


      if (crypto == currency) {
        await logger.info({
          "module": "Limit Sell",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Succes"
        }, i18n.__("Currency and Crypto should not be same").message)
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Currency and Crypto should not be same").message, []);
      }
      // Get and check Crypto Wallet details
      // Get and check Crypto Wallet details
      let walletData = await WalletHelper.checkWalletStatus(crypto, currency, user_id);
      if (!walletData.currency) {
        await logger.info({
          "module": "Limit Sell",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Succes"
        }, i18n.__("Create Currency Wallet").message)
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Currency Wallet").message, []);
      }
      if (!walletData.crypto) {
        await logger.info({
          "module": "Limit Sell",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Succes"
        }, i18n.__("Create Crypto Wallet").message)
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Crypto Wallet").message, []);
      }

      const checkUser = Helper.checkWhichUser(user_id);

      if ((parseFloat(walletData.crypto.placed_balance) <= orderQuantity) && checkUser != true) {
        await logger.info({
          "module": "Limit Sell",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Succes"
        }, i18n.__("Insufficient balance to place order").message)
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Insufficient balance to place order").message, []);
      }

      var queueName = process.env.QUEUE_NAME
      var queueData = {
        symbol,
        user_id,
        side,
        order_type,
        orderQuantity,
        limit_price,
        res: null,
        flag: false,
        crypto: walletData.crypto.coin_id,
        currency: walletData.currency.coin_id
      }
      var responseValue = await QueueValue.publishToQueue(queueName, queueData)

      if (responseValue == 0) {
        await logger.info({
          "module": "Market Buy",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Success"
        }, i18n.__('Order Success').message)
        return Helper.jsonFormat(res, constants.SUCCESS_CODE, "Your order is successfully placed.", []);
      } else {
        await logger.info({
          "module": "Market Buy",
          "user_id": "user_" + user_id,
          "url": "Trade Function",
          "type": "Error"
        })
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("server error").message, []);
      }


    } else if (tradeDataChecking.status == true || tradeDataChecking.status == "true") {
      await logger.info({
        "module": "Limit Sell",
        "user_id": "user_" + user_id,
        "url": "Trade Function",
        "type": "Succes"
      }, i18n.__('panic button enabled').message)
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__('panic button enabled').message, []);
    } else if (tradeDataChecking.response == false || tradeDataChecking.response == "false") {
      await logger.info({
        "module": "Limit Sell",
        "user_id": "user_" + user_id,
        "url": "Trade Function",
        "type": "Succes"
      }, i18n.__(tradeDataChecking.msg).message)
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__(tradeDataChecking.msg).message, []);
    }
  }
}

module.exports = new TradeController();