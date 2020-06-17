var PairsModel = require("../models/Pairs");

var getPairPrecision = async (symbol) => {
    var getPairDetails = await PairsModel
        .query()
        .first()
        .select("price_precision", "quantity_precision")
        .where("deleted_at", null)
        .andWhere("name", symbol)
        .orderBy("id", "DESC");

    return (getPairDetails)
}

module.exports = {
    getPairPrecision
}