var TradeHistoryModel = require("../../models/TradeHistory");

var updateValue = async (id, crypto, currency, user_fee, requested_fee) => {
    var updatedValue = await TradeHistoryModel
        .query()
        .where('deleted_at', null)
        .andWhere('id', id)
        .updateAndFetch({
            user_fee: inputs.user_fee,
            requested_fee: inputs.requested_fee,
            user_coin: inputs.crypto,
            requested_coin: inputs.currency
        });

    return updatedValue;
}

module.exports = {
    updateValue
}