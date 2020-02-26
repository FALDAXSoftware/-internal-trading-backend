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
var moment = require('moment');
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
var OrderUpdate = require("../../helpers/buy/update-buy-order");
var OrderDelete = require("../../helpers/buy/delete-order");
var UserNotifications = require("../../models/UserNotifications");
var Users = require("../../models/UsersModel");
var ActivityHelper = require("../../helpers/activity/add");
var ActivityUpdateHelper = require("../../helpers/activity/update");
var sellUpdate = require("../../helpers/sell/update");
var sellDelete = require("../../helpers/sell/delete-order");
var limitMatch = require("../../helpers/limit/limit-buy-match");

/**
 * Trade Controller : Used for live tradding
 */
class TradeController extends AppController {

  constructor() {
    super();
  }
  // Used to Sell market order
  // async marketSell( req, res, next){
  //   try {
  //     let {
  //       symbol,
  //       side,
  //       order_type,
  //       orderQuantity,
  //       user_id
  //     } = req.body;
  //     let userIds = [];
  //     userIds.push(user_id);
  //     orderQuantity = parseFloat(orderQuantity);
  //     // Get Currency/Crypto each asset
  //     let {crypto,currency} =await Currency.get_currencies( symbol );
  //     // Get and check Crypto Wallet details
  //     let crypto_wallet_data = await WalletHelper.checkWalletStatus( crypto, user_id );
  //     if( crypto_wallet_data == 0 ){
  //       return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Currency Wallet").message, []);
  //     }else if( crypto_wallet_data == 2 ){
  //       return Helper.jsonFormat(res, constants.NO_RECORD, i18n.__("Coin not found").message, []);
  //     }
  //     // Get and check Currency Wallet details
  //     let currency_wallet_data = await WalletHelper.checkWalletStatus( currency, user_id );
  //     if( currency_wallet_data == 0 ){
  //       return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Currency Wallet").message, []);
  //     }else if( currency_wallet_data == 2 ){
  //       return Helper.jsonFormat(res, constants.NO_RECORD, i18n.__("Coin not found").message, []);
  //     }
  //     // Check balance sufficient or not
  //     if( parseFloat(crypto_wallet_data.balance) <= orderQuantity  ){
  //       return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Insufficient balance to place order").message, []);
  //     }
  //     // Make Market Sell order
  //     let object = {
  //       crypto:crypto,
  //       currency:currency,
  //       symbol:symbol,
  //       side:side,
  //       order_type:order_type,
  //       orderQuantity:orderQuantity,
  //       user_id:user_id,
  //       crypto_wallet_data:crypto_wallet_data,
  //       currency_wallet_data:currency_wallet_data,
  //       userIds:userIds
  //     };
  //     let market_sell_order = await this.makeMarketSellOrder( object );
  //     // let buy_book_data = await BuyBookHelper.getBuyBookOrder( crypto, currency );
  //     // console.log("buy_book_data",buy_book_data);
  //     // let maker_taker_fees = await MakerTakerFees.getFeesValue( crypto, currency );
  //     // console.log("maker_taker_fees",maker_taker_fees);

  //     // var quantityValue = orderQuantity.toFixed(process.env.QUANTITY_PRECISION)

  //     // if (buy_book_data && buy_book_data.length > 0) {
  //     //   var availableQty = buy_book_data[0].quantity;
  //     //   var currentBuyBookDetails = buy_book_data[0];
  //     //   var priceValue = (currentBuyBookDetails.price).toFixed(process.env.PRICE_PRECISION)
  //     //   var now = new Date();
  //     //   var orderData = {
  //     //     user_id: user_id,
  //     //     symbol: symbol,
  //     //     side: side,
  //     //     order_type: order_type,
  //     //     created_at: now,
  //     //     updated_at: now,
  //     //     maximum_time: now,
  //     //     fill_price: priceValue,
  //     //     limit_price: 0,
  //     //     stop_price: 0,
  //     //     price: 0,
  //     //     quantity: quantityValue,
  //     //     order_status: "partially_filled",
  //     //     currency: currency,
  //     //     settle_currency: crypto
  //     //   }

  //     //   var resultData = {
  //     //     ...orderData
  //     //   }
  //     //   resultData.is_market = true;
  //     //   resultData.fix_quantity = quantityValue;
  //     //   resultData.maker_fee = maker_taker_fees.makerFee;
  //     //   resultData.taker_fee = maker_taker_fees.takerFee;
  //     //   // Log this in Activity
  //     //   await ActivityAdd.addActivityData( resultData )

  //     //   if (quantityValue <= availableQty) {
  //     //     if ((priceValue * quantityValue).toFixed(process.envl.TOTAL_PRECISION) <= (crypto_wallet_data.placed_balance).toFixed(process.env.TOTAL_PRECISION)) {
  //     //       var trade_history_data = {
  //     //         ...orderData
  //     //       };
  //     //       trade_history_data.maker_fee = maker_taker_fees.makerFee;
  //     //       trade_history_data.taker_fee = maker_taker_fees.takerFee;
  //     //       trade_history_data.quantity = quantityValue;
  //     //       trade_history_data.requested_user_id = currentBuyBookDetails.user_id;
  //     //       trade_history_data.created_at = now;
  //     //       trade_history_data.fix_quantity = quantityValue;
  //     //       let updatedActivity = await sails
  //     //         .helpers
  //     //         .tradding
  //     //         .activity
  //     //         .update(currentBuyBookDetails.activity_id, trade_history_data);
  //     //       // Update activity
  //     //       await ActivityUpdate.updateActivityData( currentBuyBookDetails.activity_id, trade_history_data )
  //     //       userIds.push(parseInt(trade_history_data.requested_user_id));
  //     //       var request = {
  //     //         requested_user_id: trade_history_data.requested_user_id,
  //     //         user_id: user_id,
  //     //         currency:currency,
  //     //         side: side,
  //     //         settle_currency: crypto,
  //     //         quantity: quantityValue,
  //     //         fill_price: priceValue
  //     //       }

  //     //       // var tradingFees = await sails
  //     //       //   .helpers
  //     //       //   .wallet
  //     //       //   .tradingFees(request, fees.makerFee, fees.takerFee)
  //     //       //   .intercept("serverError", () => {
  //     //       //     return new Error("serverError")
  //     //       //   });
  //     //       var tradingFees = await TradingFees.getTraddingFees( request, maker_taker_fees.makerFee, maker_taker_fees.takerFee )

  //     //       trade_history_data.user_fee = (tradingFees.userFee);
  //     //       trade_history_data.requested_fee = (tradingFees.requestedFee);
  //     //       trade_history_data.user_coin = crypto;
  //     //       trade_history_data.requested_coin = currency;
  //     //       // Log into trade history
  //     //       let tradeHistory = await TradeAdd.addTradeHistory( trade_history_data );
  //     //       let remainigQuantity = availableQty - quantityValue;

  //     //       if (remainigQuantity > 0) {
  //     //           let updatedBuyBook = await OrderUpdate.updateBuyBook( currentBuyBookDetails.id,  {
  //     //             quantity: (remainigQuantity).toFixed(sails.config.local.QUANTITY_PRECISION)
  //     //           })
  //     //       } else {
  //     //         let deleteBuyBook = await OrderDelete.deleteOrder( currentBuyBookDetails.id)
  //     //       }

  //     //     } else {
  //     //       // return exits.insufficientBalance();
  //     //     }
  //     //   } else {
  //     //     var remainingQty = quantityValue - availableQty;
  //     //     if ((priceValue * quantityValue).toFixed(process.env.TOTAL_PRECISION) <= (wallet.placed_balance).toFixed(process.env.TOTAL_PRECISION)) {
  //     //       var trade_history_data = {
  //     //         ...orderData
  //     //       };
  //     //       trade_history_data.maker_fee = maker_taker_fees.makerFee;
  //     //       trade_history_data.taker_fee = maker_taker_fees.takerFee;
  //     //       trade_history_data.quantity = availableQty;
  //     //       trade_history_data.requested_user_id = currentBuyBookDetails.user_id;
  //     //       trade_history_data.created_at = now;

  //     //       trade_history_data.fix_quantity = quantityValue;

  //     //       let updatedActivity = await ActivityUpdate.updateActivityData( currentBuyBookDetails.activity_id, trade_history_data )
  //     //       userIds.push(parseInt(trade_history_data.requested_user_id));
  //     //       var request = {
  //     //         requested_user_id: trade_history_data.requested_user_id,
  //     //         user_id: inputs.user_id,
  //     //         currency: currency,
  //     //         side: inputs.side,
  //     //         settle_currency: crypto,
  //     //         quantity: availableQty,
  //     //         fill_price: priceValue
  //     //       }
  //     //       // var tradingFees = await sails
  //     //       //   .helpers
  //     //       //   .wallet
  //     //       //   .tradingFees(request, fees.makerFee, fees.takerFee)
  //     //       //   .intercept("serverError", () => {
  //     //       //     return new Error("serverError")
  //     //       //   });

  //     //       var tradingFees = await TradingFees.getTraddingFees( request, maker_taker_fees.makerFee, maker_taker_fees.takerFee )
  //     //       trade_history_data.user_fee = (tradingFees.userFee);
  //     //       trade_history_data.requested_fee = (tradingFees.requestedFee);
  //     //       trade_history_data.user_coin = crypto;
  //     //       trade_history_data.requested_coin = currency;

  //     //       let tradeHistory = await TradeAdd.addTradeHistory( trade_history_data );
  //     //       let deleteBuyBook = await OrderDelete.deleteOrder( currentBuyBookDetails.id)

  //     //       let requestData = {
  //     //         ...inputs
  //     //       }
  //     //       requestData.orderQuantity = remainingQty;
  //     //       let response = await sails
  //     //         .helpers
  //     //         .tradding
  //     //         .marketSell(requestData.symbol, requestData.user_id, requestData.side, requestData.order_type, requestData.orderQuantity)
  //     //         .intercept("coinNotFound", () => {
  //     //           return new Error("coinNotFound");
  //     //         })
  //     //         .intercept("serverError", () => {
  //     //           return new Error("serverError");
  //     //         })
  //     //         .intercept("insufficientBalance", () => {
  //     //           return new Error("insufficientBalance");
  //     //         })
  //     //         .intercept("orderBookEmpty", () => {
  //     //           return new Error("orderBookEmpty");
  //     //         });


  //     //     } else {
  //     //       // return exits.insufficientBalance();
  //     //     }

  //     //   }

  //     // } else {
  //     //   // return exits.orderBookEmpty();
  //     // }


  //     return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__('Order Success').message, []);
  //   }catch(err){
  //     console.log("err",err);
  //     return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("server error").message, []);
  //   }
  // }
  async marketSell(req, res, next) {
    try {
      let {
        symbol,
        side,
        order_type,
        orderQuantity,
        user_id
      } = req.body;
      let userIds = [];
      userIds.push(user_id);
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
      // Get and check Currency Wallet details
      // let currency_wallet_data = await WalletHelper.checkWalletStatus(currency, user_id);
      // if (currency_wallet_data == 0) {
      //   return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Create Currency Wallet").message, []);
      // } else if (currency_wallet_data == 2) {
      //   return Helper.jsonFormat(res, constants.NO_RECORD, i18n.__("Coin not found").message, []);
      // }
      // Check balance sufficient or not
      if (parseFloat(crypto_wallet_data.balance) <= orderQuantity) {
        return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Insufficient balance to place order").message, []);
      }
      // Make Market Sell order
      let buy_book_data = await BuyBookHelper.getBuyBookOrder(crypto, currency);
      console.log("buy_book_data", buy_book_data);
      let maker_taker_fees = await MakerTakerFees.getFeesValue(crypto, currency);
      console.log("maker_taker_fees", maker_taker_fees);

      var quantityValue = orderQuantity.toFixed(process.env.QUANTITY_PRECISION)

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
          if ((priceValue * quantityValue).toFixed(process.envl.TOTAL_PRECISION) <= (crypto_wallet_data.placed_balance).toFixed(process.env.TOTAL_PRECISION)) {
            var trade_history_data = {
              ...orderData
            };
            trade_history_data.maker_fee = maker_taker_fees.makerFee;
            trade_history_data.taker_fee = maker_taker_fees.takerFee;
            trade_history_data.quantity = quantityValue;
            trade_history_data.requested_user_id = currentBuyBookDetails.user_id;
            trade_history_data.created_at = now;
            trade_history_data.fix_quantity = quantityValue;
            let updatedActivity = await sails
              .helpers
              .tradding
              .activity
              .update(currentBuyBookDetails.activity_id, trade_history_data);
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

            // var tradingFees = await sails
            //   .helpers
            //   .wallet
            //   .tradingFees(request, fees.makerFee, fees.takerFee)
            //   .intercept("serverError", () => {
            //     return new Error("serverError")
            //   });
            var tradingFees = await TradingFees.getTraddingFees(request, maker_taker_fees.makerFee, maker_taker_fees.takerFee)

            trade_history_data.user_fee = (tradingFees.userFee);
            trade_history_data.requested_fee = (tradingFees.requestedFee);
            trade_history_data.user_coin = crypto;
            trade_history_data.requested_coin = currency;
            // Log into trade history
            let tradeHistory = await TradeAdd.addTradeHistory(trade_history_data);
            let remainigQuantity = availableQty - quantityValue;

            if (remainigQuantity > 0) {
              let updatedBuyBook = await OrderUpdate.updateBuyBook(currentBuyBookDetails.id, {
                quantity: (remainigQuantity).toFixed(sails.config.local.QUANTITY_PRECISION)
              })
            } else {
              let deleteBuyBook = await OrderDelete.deleteOrder(currentBuyBookDetails.id)
            }

          } else {
            // return exits.insufficientBalance();
          }
        } else {
          var remainingQty = quantityValue - availableQty;
          if ((priceValue * quantityValue).toFixed(process.env.TOTAL_PRECISION) <= (wallet.placed_balance).toFixed(process.env.TOTAL_PRECISION)) {
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
              user_id: inputs.user_id,
              currency: currency,
              side: inputs.side,
              settle_currency: crypto,
              quantity: availableQty,
              fill_price: priceValue
            }
            // var tradingFees = await sails
            //   .helpers
            //   .wallet
            //   .tradingFees(request, fees.makerFee, fees.takerFee)
            //   .intercept("serverError", () => {
            //     return new Error("serverError")
            //   });

            var tradingFees = await TradingFees.getTraddingFees(request, maker_taker_fees.makerFee, maker_taker_fees.takerFee)
            trade_history_data.user_fee = (tradingFees.userFee);
            trade_history_data.requested_fee = (tradingFees.requestedFee);
            trade_history_data.user_coin = crypto;
            trade_history_data.requested_coin = currency;

            let tradeHistory = await TradeAdd.addTradeHistory(trade_history_data);
            let deleteBuyBook = await OrderDelete.deleteOrder(currentBuyBookDetails.id)

            let requestData = {
              ...inputs
            }
            requestData.orderQuantity = remainingQty;
            // let response = await sails
            //   .helpers
            //   .tradding
            //   .marketSell(requestData.symbol, requestData.user_id, requestData.side, requestData.order_type, requestData.orderQuantity)
            //   .intercept("coinNotFound", () => {
            //     return new Error("coinNotFound");
            //   })
            //   .intercept("serverError", () => {
            //     return new Error("serverError");
            //   })
            //   .intercept("insufficientBalance", () => {
            //     return new Error("insufficientBalance");
            //   })
            //   .intercept("orderBookEmpty", () => {
            //     return new Error("orderBookEmpty");
            //   });
          } else {
            // return exits.insufficientBalance();
          }

        }

      } else {
        // return exits.orderBookEmpty();
      }


      return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__('Order Success').message, []);
    } catch (err) {
      console.log("err", err);
      return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("server error").message, []);
    }
  }

  // Helper : Market Sell Order
  // async makeMarketSellOrder( alldata ){
  //   let {
  //     crypto,
  //     currency,
  //     symbol,
  //     side,
  //     order_type,
  //     orderQuantity,
  //     user_id,
  //     crypto_wallet_data,
  //     currency_wallet_data,
  //     userIds
  //   } = alldata;
  //   // Make Market Sell order
  //   let buy_book_data = await BuyBookHelper.getBuyBookOrder( crypto, currency );
  //   console.log("buy_book_data",buy_book_data);
  //   let maker_taker_fees = await MakerTakerFees.getFeesValue( crypto, currency );
  //   console.log("maker_taker_fees",maker_taker_fees);

  //   var quantityValue = orderQuantity.toFixed(process.env.QUANTITY_PRECISION)

  //   if (buy_book_data && buy_book_data.length > 0) {
  //     var availableQty = buy_book_data[0].quantity;
  //     var currentBuyBookDetails = buy_book_data[0];
  //     var priceValue = (currentBuyBookDetails.price).toFixed(process.env.PRICE_PRECISION)
  //     var now = new Date();
  //     var orderData = {
  //       user_id: user_id,
  //       symbol: symbol,
  //       side: side,
  //       order_type: order_type,
  //       created_at: now,
  //       updated_at: now,
  //       maximum_time: now,
  //       fill_price: priceValue,
  //       limit_price: 0,
  //       stop_price: 0,
  //       price: 0,
  //       quantity: quantityValue,
  //       order_status: "partially_filled",
  //       currency: currency,
  //       settle_currency: crypto
  //     }

  //     var resultData = {
  //       ...orderData
  //     }
  //     resultData.is_market = true;
  //     resultData.fix_quantity = quantityValue;
  //     resultData.maker_fee = maker_taker_fees.makerFee;
  //     resultData.taker_fee = maker_taker_fees.takerFee;
  //     // Log this in Activity
  //     await ActivityAdd.addActivityData( resultData )

  //     if (quantityValue <= availableQty) {
  //       if ((priceValue * quantityValue).toFixed(process.envl.TOTAL_PRECISION) <= (crypto_wallet_data.placed_balance).toFixed(process.env.TOTAL_PRECISION)) {
  //         var trade_history_data = {
  //           ...orderData
  //         };
  //         trade_history_data.maker_fee = maker_taker_fees.makerFee;
  //         trade_history_data.taker_fee = maker_taker_fees.takerFee;
  //         trade_history_data.quantity = quantityValue;
  //         trade_history_data.requested_user_id = currentBuyBookDetails.user_id;
  //         trade_history_data.created_at = now;
  //         trade_history_data.fix_quantity = quantityValue;
  //         let updatedActivity = await sails
  //           .helpers
  //           .tradding
  //           .activity
  //           .update(currentBuyBookDetails.activity_id, trade_history_data);
  //         // Update activity
  //         await ActivityUpdate.updateActivityData( currentBuyBookDetails.activity_id, trade_history_data )
  //         userIds.push(parseInt(trade_history_data.requested_user_id));
  //         var request = {
  //           requested_user_id: trade_history_data.requested_user_id,
  //           user_id: user_id,
  //           currency:currency,
  //           side: side,
  //           settle_currency: crypto,
  //           quantity: quantityValue,
  //           fill_price: priceValue
  //         }

  //         // var tradingFees = await sails
  //         //   .helpers
  //         //   .wallet
  //         //   .tradingFees(request, fees.makerFee, fees.takerFee)
  //         //   .intercept("serverError", () => {
  //         //     return new Error("serverError")
  //         //   });
  //         var tradingFees = await TradingFees.getTraddingFees( request, maker_taker_fees.makerFee, maker_taker_fees.takerFee )

  //         trade_history_data.user_fee = (tradingFees.userFee);
  //         trade_history_data.requested_fee = (tradingFees.requestedFee);
  //         trade_history_data.user_coin = crypto;
  //         trade_history_data.requested_coin = currency;
  //         // Log into trade history
  //         let tradeHistory = await TradeAdd.addTradeHistory( trade_history_data );
  //         let remainigQuantity = availableQty - quantityValue;

  //         if (remainigQuantity > 0) {
  //             let updatedBuyBook = await OrderUpdate.updateBuyBook( currentBuyBookDetails.id,  {
  //               quantity: (remainigQuantity).toFixed(sails.config.local.QUANTITY_PRECISION)
  //             })
  //         } else {
  //           let deleteBuyBook = await OrderDelete.deleteOrder( currentBuyBookDetails.id)
  //         }

  //       } else {
  //         // return exits.insufficientBalance();
  //         return {
  //           status:2,
  //           message:'insufficientBalance'
  //         }
  //       }
  //     } else {
  //       var remainingQty = quantityValue - availableQty;
  //       if ((priceValue * quantityValue).toFixed(process.env.TOTAL_PRECISION) <= (wallet.placed_balance).toFixed(process.env.TOTAL_PRECISION)) {
  //         var trade_history_data = {
  //           ...orderData
  //         };
  //         trade_history_data.maker_fee = maker_taker_fees.makerFee;
  //         trade_history_data.taker_fee = maker_taker_fees.takerFee;
  //         trade_history_data.quantity = availableQty;
  //         trade_history_data.requested_user_id = currentBuyBookDetails.user_id;
  //         trade_history_data.created_at = now;

  //         trade_history_data.fix_quantity = quantityValue;

  //         let updatedActivity = await ActivityUpdate.updateActivityData( currentBuyBookDetails.activity_id, trade_history_data )
  //         userIds.push(parseInt(trade_history_data.requested_user_id));
  //         var request = {
  //           requested_user_id: trade_history_data.requested_user_id,
  //           user_id: inputs.user_id,
  //           currency: currency,
  //           side: inputs.side,
  //           settle_currency: crypto,
  //           quantity: availableQty,
  //           fill_price: priceValue
  //         }
  //         // var tradingFees = await sails
  //         //   .helpers
  //         //   .wallet
  //         //   .tradingFees(request, fees.makerFee, fees.takerFee)
  //         //   .intercept("serverError", () => {
  //         //     return new Error("serverError")
  //         //   });

  //         var tradingFees = await TradingFees.getTraddingFees( request, maker_taker_fees.makerFee, maker_taker_fees.takerFee )
  //         trade_history_data.user_fee = (tradingFees.userFee);
  //         trade_history_data.requested_fee = (tradingFees.requestedFee);
  //         trade_history_data.user_coin = crypto;
  //         trade_history_data.requested_coin = currency;

  //         let tradeHistory = await TradeAdd.addTradeHistory( trade_history_data );
  //         let deleteBuyBook = await OrderDelete.deleteOrder( currentBuyBookDetails.id)

  //         let requestData = {
  //           ...inputs
  //         }
  //         requestData.orderQuantity = remainingQty;
  //         // let response = await sails
  //         //   .helpers
  //         //   .tradding
  //         //   .marketSell(requestData.symbol, requestData.user_id, requestData.side, requestData.order_type, requestData.orderQuantity)
  //         //   .intercept("coinNotFound", () => {
  //         //     return new Error("coinNotFound");
  //         //   })
  //         //   .intercept("serverError", () => {
  //         //     return new Error("serverError");
  //         //   })
  //         //   .intercept("insufficientBalance", () => {
  //         //     return new Error("insufficientBalance");
  //         //   })
  //         //   .intercept("orderBookEmpty", () => {
  //         //     return new Error("orderBookEmpty");
  //         //   });
  //           let object = {
  //             symbol:requestData.symbol,
  //             user_id:requestData.user_id,
  //             side:requestData.side,
  //             order_type:requestData.order_type,
  //             orderQuantity:requestData.orderQuantity,
  //           };
  //           let market_sell_order = await this.makeMarketSellOrder( object );

  //       } else {
  //         // return exits.insufficientBalance();
  //         return {
  //           status:2,
  //           message:'insufficientBalance'
  //         }
  //       }

  //     }

  //   } else {
  //     // return exits.orderBookEmpty();
  //     return {
  //       status:2,
  //       message:'orderBookEmpty'
  //     }
  //   }

  //   // console.log("----wallet", wallet);
  //   for (var i = 0; i < userIds.length; i++) {
  //     // Notification Sending for users
  //     var userNotification = await UserNotifications.getSingleData({
  //       user_id: userIds[i],
  //       deleted_at: null,
  //       slug: 'trade_execute'
  //     })
  //     var user_data = await Users.getSingleData({
  //       deleted_at: null,
  //       id: userIds[i],
  //       is_active: true
  //     });
  //     if (user_data != undefined) {
  //       if (userNotification != undefined) {
  //         if (userNotification.email == true || userNotification.email == "true") {
  //           if (user_data.email != undefined){
  //             // await sails.helpers.notification.send.email("trade_execute", user_data)
  //             // var allData = {
  //             //   template: "emails/common.pug",
  //             //   email: get_user.email,
  //             //   extraData: {
  //             //     html_template_content: parseHTML.parse(emailContent)
  //             //   },
  //             //   subject: ""
  //             // }
  //             // await Helper.SendEmail(res, )
  //           }
  //         }
  //         if (userNotification.text == true || userNotification.text == "true") {
  //           if (user_data.phone_number != undefined){
  //             // await sails.helpers.notification.send.text("trade_execute", user_data)
  //           }
  //         }
  //       }
  //     }
  //   }
  //   await sails
  //     .helpers
  //     .sockets
  //     .tradeEmit(crypto, currency, userIds);
  //   return exits.success();
  // }
  async marketBuy(req, res) {
    let {
      symbol,
      side,
      order_type,
      orderQuantity,
      user_id
    } = req.body;
    var responseData = await module.exports.makeMarketBuyOrder(symbol,
      side,
      order_type,
      orderQuantity,
      user_id);

    console.log(responseData)
  }

  // Used for function to make Market Buy order
  async makeMarketBuyOrder(symbol, side, order_type, orderQuantity, user_id) {
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

    console.log("wallet", wallet)

    if (sellBook && sellBook.length > 0) {
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
        settle_currency: crypto
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
          console.log("tradingFees", tradingFees)
          var usd_value = resultData * (request.fill_price * request.quantity);
          trade_history_data.user_fee = (tradingFees.userFee);
          trade_history_data.requested_fee = (tradingFees.requestedFee);
          trade_history_data.user_coin = crypto;
          trade_history_data.requested_coin = currency;
          console.log("trade_history_data", trade_history_data)

          let tradeHistory = await TradeAdd.addTradeHistory(trade_history_data);

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
          return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("Insufficient balance to place order").message, []);
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
          let response = await module.exports.makeMarketBuyOrder(requestData.symbol, requestData.side, requestData.order_type, requestData.orderQuantity, requestData.user_id)
          console.log(response);
        }
      }
    }
  }
  // Used to Create Buy Limit order
  async limitBuy(req, res) {
    let {
      symbol,
      user_id,
      side,
      order_type,
      orderQuantity,
      limit_price
    } = req.body;

    let responseData = await module.exports.limitBuyOrder(symbol,
      user_id,
      side,
      order_type,
      orderQuantity,
      limit_price);
  }

  async limitBuyOrder(symbol, user_id, side, order_type, orderQuantity, limit_price) {
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
      'created': now,
      'updated': now,
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
    resultData.isMarket = false;
    resultData.fix_quantity = quantityValue

    var activity = await ActivityHelper.addActivityData(resultData);
    resultData.maker_fee = fees.makerFee;
    resultData.taker_fee = fees.takerFee;

    if (sellBook && sellBook.length > 0) {
      var currentPrice = sellBook[0].price;
      if (priceValue >= currentPrice) {
        var limitMatchData = await limitMatch.limitData(buyLimitOrderData, crypto, currency, activity);

        // Send Notification to users
        // Emit Socket Event
      } else {
        buyLimitOrderData.activity_id = activity.id;
        var total_price = buyLimitOrderData.quantity * buyLimitOrderData.limit_price;
        if (total_price <= wallet.placed_balance) {
          buyLimitOrderData.is_partially_fulfilled = true;
          buyLimitOrderData.is_filled = false;
          buyLimitOrderData.added = true;
          var addBuyBook = await BuyAdd.addBuyBookData(buyLimitOrderData);
          addBuyBook.added = true;

          // Send Notification to users
          // Emit Socket Event
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
        // Emit Socket Event
      }
    }
  }

}

module.exports = new TradeController();