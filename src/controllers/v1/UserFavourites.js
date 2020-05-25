const { raw } = require('objection');
var express = require('express');
var app = express();
var moment = require('moment');
var i18n = require("i18n");

var { AppController } = require('./AppController');
const constants = require('../../config/constants');
var Helper = require("../../helpers/helpers");
var UserFavouriteModel = require("../../models/UserFavourites");
var TradeHistoryModel = require("../../models/TradeHistory");
var Currency = require("../../helpers/currency");
var { map, sortBy } = require('lodash');

class UserFavourites extends AppController {

    constructor() {
        super();
    }

    async getFavouritesData(req, res) {
        // return new Promise(async (resolve, reject) => {
        try {
            var socket_headers = req.headers;
            console.log(JSON.stringify(socket_headers))
            var authentication = require("../../config/authorization")(socket_headers);
            let user_id = authentication.user_id;
            var symbol = req.query.symbol;
            let { crypto, currency } = await Currency.get_currencies(symbol);
            var cardData = [];

            var yesterday = moment()
                .subtract(1, 'days')
                .format('YYYY-MM-DD HH:mm:ss.SSS');
            var today = moment().format('YYYY-MM-DD HH:mm:ss.SSS');

            var total_price = 0;
            var average_price = 0;
            var flag = true;

            var price = await TradeHistoryModel
                .query()
                .select()
                .where('settle_currency', crypto)
                .andWhere('currency', currency)
                .andWhere('created_at', '>=', yesterday)
                .orderBy('id', 'DESC')

            if (price.length == 0) {
                average_price = 0;
            } else {
                map(price, p => {
                    total_price = total_price + (p.fill_price / p.quantity);
                });
                average_price = total_price / (price.length);
            }

            // var current_price = await TradeHistoryModel
            //     .query()
            //     .first()
            //     .where('settle_currency', crypto)
            //     .andWhere('currency', currency)
            //     .andWhere('created_at', '<=', today)
            //     .andWhere('created_at', '>=', yesterday)
            //     .orderBy('id', 'DESC')

            var current_price = 0.0
            if (price.length == 0) {
                current_price = 0;
            } else {
                current_price = price[0]['fill_price'];
            }

            // var previous_price = await TradeHistoryModel
            //     .query()
            //     .first()
            //     .where('settle_currency', crypto)
            //     .andWhere('currency', currency)
            //     .andWhere('created_at', '<=', today)
            //     .andWhere('created_at', '>=', yesterday)
            //     .orderBy('id', 'ASC')

            var previous_price = 0.0
            if (price.length == 0) {
                previous_price = 0;
            } else {
                previous_price = price[price.length - 1]['fill_price'];
            }

            var diffrence = current_price - previous_price;
            var percentchange = (diffrence * 100 / previous_price);

            if (percentchange == NaN || percentchange == "-Infinity") {
                percentchange = 0;
            } else {
                percentchange = percentchange;
            }

            if (diffrence <= 0) {
                flag = false;
            } else {
                flag = true;
            }

            console.log(today)
            console.log(yesterday)
            var tradeorderdetails = await TradeHistoryModel
                .query()
                .where('settle_currency', crypto)
                .andWhere('currency', currency)
                .andWhere('created_at', '<=', today)
                .andWhere('created_at', '>=', yesterday)
                .orderBy('created_at', 'ASC')

            var card_data = {
                "pair_from": crypto,
                "pair_to": currency,
                "average_price": average_price,
                "diffrence": diffrence,
                "percentchange": percentchange,
                "flag": flag,
                "tradeChartDetails": tradeorderdetails
                // "socket_id": socket_id
            }

            cardData.push(card_data);
            return res
                .status(200)
                .json({
                    "status": constants.SUCCESS_CODE,
                    "message": "Favourites List",
                    "data": cardData
                });
        } catch (error) {
            console.log("err", JSON.stringify(error));
            return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("server error").message, []);
        }
        // })
    }

    async getFavourites(user_id, socket_id) {
        return new Promise(async (resolve, reject) => {
            try {
                var cardData = [];
                var getFavourites = await UserFavouriteModel
                    .query()
                    .select()
                    .where('user_id', user_id)
                    .andWhere('deleted_at', null)
                    .orderBy('id', 'DESC');

                var yesterday = moment()
                    .subtract(1, 'days')
                    .format('YYYY-MM-DD HH:mm:ss.SSS');
                var today = moment().format('YYYY-MM-DD HH:mm:ss.SSS');

                var promises = map(getFavourites, async data => {
                    var total_price = 0;
                    var average_price = 0;
                    var flag = true;

                    var price = await TradeHistoryModel
                        .query()
                        .select()
                        .where('settle_currency', data.pair_to)
                        .andWhere('currency', data.pair_from)
                        .andWhere('created_at', '>=', yesterday)
                        .orderBy('id', 'DESC')

                    if (price.length == 0) {
                        average_price = 0;
                    } else {
                        map(price, p => {
                            total_price = total_price + (p.fill_price / p.quantity);
                        });
                        average_price = total_price / (price.length);
                    }

                    var current_price = await TradeHistoryModel
                        .query()
                        .first()
                        .where('settle_currency', data.pair_to)
                        .andWhere('currency', data.pair_from)
                        .andWhere('created_at', '<=', today)
                        .andWhere('created_at', '>=', yesterday)
                        .orderBy('id', 'DESC')

                    if (current_price == undefined) {
                        current_price = 0;
                    } else {
                        current_price = current_price.fill_price;
                    }

                    var previous_price = await TradeHistoryModel
                        .query()
                        .first()
                        .where('settle_currency', data.pair_to)
                        .andWhere('currency', data.pair_from)
                        .andWhere('created_at', '<=', today)
                        .andWhere('created_at', '>=', yesterday)
                        .orderBy('id', 'ASC')

                    if (previous_price == undefined) {
                        previous_price = 0;
                    } else {
                        previous_price = previous_price.fill_price;
                    }

                    var diffrence = current_price - previous_price;
                    var percentchange = (diffrence * 100 / previous_price);

                    if (percentchange == NaN || percentchange == "-Infinity") {
                        percentchange = 0;
                    } else {
                        percentchange = percentchange;
                    }

                    if (diffrence <= 0) {
                        flag = false;
                    } else {
                        flag = true;
                    }

                    var tradeorderdetails = await TradeHistoryModel
                        .query()
                        .where('settle_currency', data.pair_to)
                        .andWhere('currency', data.pair_from)
                        .andWhere('created_at', '<=', today)
                        .andWhere('created_at', '>=', yesterday)
                        .orderBy('created_at', 'ASC')

                    var card_data = {
                        "pair_from": data.pair_from,
                        "pair_to": data.pair_to,
                        "average_price": average_price,
                        "diffrence": diffrence,
                        "percentchange": percentchange,
                        "flag": flag,
                        "tradeChartDetails": tradeorderdetails,
                        "socket_id": socket_id
                    }

                    cardData.push(card_data);
                    return cardData;
                })

                await Promise.all(promises);
                resolve({
                    "status": constants.SUCCESS_CODE,
                    "message": "Favourites List",
                    "data": cardData
                });
            } catch (error) {
                console.log("err", JSON.stringify(error));
                // return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("server error").message, []);
            }
        })
    }

    async addFavouritesData(req, res) {
        try {
            // var data = req.body;
            var pair_from = req.body.pair_from;
            var pair_to = req.body.pair_to;
            // var priority = req.body.priority;
            // var socket_id = req.body.socket_id;
            var user_id = req.body.user_id;
            var status = req.body.status;

            if (status == 1) {
                var userData = await UserFavouriteModel
                    .query()
                    .select()
                    .where('user_id', user_id)
                    .andWhere('pair_from', pair_from)
                    .andWhere('pair_to', pair_to)
                    .andWhere('deleted_at', null)
                    .orderBy('id', 'DESC');

                if (userData == undefined) {
                    var userAddFavourites = await UserFavouriteModel
                        .query()
                        .insert({
                            'user_id': user_id,
                            "pair_from": pair_from,
                            "pair_to": pair_to,
                            "created_at": moment(),
                            "deleted_at": null
                        })
                    return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("pair added success").message, []);
                } else {
                    return Helper.jsonFormat(res, constants.ACCEPTED_CODE, i18n.__("pair already exist").message, []);
                }
            } else if (status == 2) {
                var userData = await UserFavouriteModel
                    .query()
                    .select()
                    .where('user_id', user_id)
                    .andWhere('pair_from', pair_from)
                    .andWhere('pair_to', pair_to)
                    .andWhere('deleted_at', null)
                    .orderBy('id', 'DESC');

                if (userData != undefined) {
                    var userUpdate = await UserFavouriteModel
                        .query()
                        .where('user_id', user_id)
                        .andWhere('pair_from', pair_from)
                        .andWhere('pair_to', pair_to)
                        .andWhere('deleted_at', null)
                        .patch({
                            'deleted_at': moment()
                        });
                }
            }


        } catch (error) {
            console.log(JSON.stringify(error))
            return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("server error").message, []);
        }
    }
}

module.exports = new UserFavourites();