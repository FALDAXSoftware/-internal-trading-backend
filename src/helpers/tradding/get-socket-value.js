var moment = require('moment');
var PairsModel = require("../../models/Pairs");
var CoinsModel = require("../../models/Coins");
var TradeHistoryModel = require("../../models/TradeHistory");

var getSocketValueData = async (pair) => {
    var pairData = [];
    var now = moment
        .utc()
        .format();
    var yesterday = moment
        .utc(now)
        .subtract(1, 'days')
        .format();

    instrumentData = await PairsModel
        .query()
        .first()
        .select()
        .where('name', 'pair')
        .andWhere('deleted_at', null)
        .andWhere('is_active', true);


}

module.exports = {
    getSocketValueData
}