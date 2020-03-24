var PairsModel = require("../../models/Pairs");
var CoinsModel = require("../../models/Coins");

var getFeesValue = async (crypto, currency) => {
    var makerTakerFees = {};
    var coin1 = await CoinsModel
        .query()
        .first()
        .select("id")
        .where('is_active', true)
        .andWhere('deleted_at', null)
        .andWhere('coin', crypto);

    var coin2 = await CoinsModel
        .query()
        .first()
        .select("id")
        .where('is_active', true)
        .andWhere('deleted_at', null)
        .andWhere('coin', currency);

    if (coin1 && coin2) {
        var pairData = await PairsModel
            .query()
            .select()
            .first()
            .where('coin_code1', coin1.id)
            .andWhere('coin_code2', coin2.id)
            .andWhere('deleted_at', null)
            .orderBy('id', 'DESC')
        if (pairData) {
            makerTakerFees = {
                makerFee: pairData.maker_fee,
                takerFee: pairData.taker_fee
            }
        }
    }

    return (makerTakerFees);
}

module.exports = {
    getFeesValue
}