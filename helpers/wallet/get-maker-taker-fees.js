var PairsModel = require("../../models/Pairs");
var CoinsModel = require("../../models/Coins");

var getFeesValue = async (crypto, currency) => {
    var makerTakerFees = {};
    var coin1 = await CoinsModel
        .query()
        .first()
        .select()
        .where('is_active', true)
        .andWhere('deleted_at', null)
        .andWhere('coin', crypto);

    var coin2 = await CoinsModel
        .query()
        .first()
        .select()
        .where('is_active', true)
        .andWhere('deleted_at', null)
        .andWhere('coin', currency);

    if (coin1 && coin2) {
        var pairData = await PairsModel
            .query()
            .select()
            .first()
            .where('coin_code1', coin1)
            .andWhere('coin_code2', coin2)
            .andWhere('deleted_at', null)
            .orderBy('id', 'DESC')

        if (pairData) {
            makerTakerFees = {
                makerFee: pair.maker_fee,
                takerFee: pair.taker_fee
            }
        }
    }

    return (makerTakerFees);
}

module.exports = {
    getFeesValue
}