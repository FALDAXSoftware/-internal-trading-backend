var CurrencyConversionModel = require("../models/CurrencyConversion");

var getFiatValue = async (crypto, currency) => {

    var fiatSql = `SELECT json(quote->'USD'->'price') as asset_1_usd, json(quote->'EUR'->'price') as asset_1_eur, 
                        json(quote->'INR'->'price') as asset_1_inr, symbol 
                        FROM currency_conversion
                        WHERE deleted_at IS NULL AND (symbol LIKE '%${crypto}%' OR symbol LIKE '%${currency}%')`

    var fiatData = await CurrencyConversionModel.knex().raw(fiatSql);
    fiatData = fiatData.rows;

    // console.log("fiatData", fiatData)

    var fiatObject = {}
    for (let index = 0; index < fiatData.length; index++) {
        // console.log(fiatData[index], fiatData[index].asset_1_inr);
        if (fiatData[index].symbol == crypto) {
            fiatObject.asset_1_usd = fiatData[index].asset_1_usd;
            fiatObject.asset_1_eur = fiatData[index].asset_1_eur;
            fiatObject.asset_1_inr = fiatData[index].asset_1_inr;
        } else if (fiatData[index].symbol == currency) {
            fiatObject.asset_2_usd = fiatData[index].asset_1_usd;
            fiatObject.asset_2_eur = fiatData[index].asset_1_eur;
            fiatObject.asset_2_inr = fiatData[index].asset_1_inr;
        }
    }

    console.log("fiatObject", JSON.stringify(fiatObject))
    return fiatObject;
}

module.exports = {
    getFiatValue
}