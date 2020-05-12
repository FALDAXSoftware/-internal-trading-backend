/*
Get depth chart detail
*/
var BuyBookModel = require("../../models/BuyBook");
var SellBookModel = require("../../models/SellBook");

var getDepthChartDetails = async (crypto, currency, limit = 100) => {
    var depthChartDetail;
    var buyDetails = await BuyBookModel
        .query()
        .where('settle_currency', crypto)
        .andWhere('currency', currency)
        .andWhere('deleted_at', null)
        .orderBy('price', 'DESC')
        .limit(limit);

    var sellDetails = await SellBookModel
        .query()
        .where('settle_currency', crypto)
        .andWhere('currency', currency)
        .andWhere('deleted_at', null)
        .orderBy('price', 'ASC')
        .limit(limit);

    let data = { "buyDetails": buyDetails, "sellDetails": sellDetails };
    return data;
}

module.exports = {
    getDepthChartDetails
}