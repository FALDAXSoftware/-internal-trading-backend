/*
Get depth chart detail
*/
var BuyBookModel = require("../../models/BuyBook");
var SellBookModel = require("../../models/SellBook");
const { raw } = require('objection');
var getDepthChartDetails = async (crypto, currency, limit = 100) => {
    var depthChartDetail;
    var buyDetails = await BuyBookModel
        .query()
        .select("price", raw("SUM(quantity) as quantity"))
        .where('settle_currency', crypto)
        .andWhere('currency', currency)
        .andWhere('deleted_at', null)
        .groupBy("price")
        .orderBy('price', 'DESC')
        .limit(limit);

    var sellDetails = await SellBookModel
        .query()
        .select("price", raw("SUM(quantity) as quantity"))
        .where('settle_currency', crypto)
        .andWhere('currency', currency)
        .andWhere('deleted_at', null)
        .groupBy("price")
        .orderBy('price', 'ASC')
        .limit(limit);

    let data = { "buyDetails": buyDetails, "sellDetails": sellDetails };
    return data;
}

module.exports = {
    getDepthChartDetails
}