var BuyBookModel = require("../../models/BuyBook");

var updateBuyBook = async (id, orderData) => {

    // var sqlQuery = await BuyBookModel.knex().raw(`UPDATE buy_book SET quantity = ${orderData.quantity}
    //                                                 WHERE CASE WHEN id = ${id} THEN pg_try_advisory_xact_lock(id) END
    //                                                 RETURNING *`)
    // sqlQuery = sqlQuery.rows[0];
    // console.log("sqlQuery", sqlQuery)

    var updateBook = await BuyBookModel
        .query()
        .patchAndFetchById(id,
            orderData
        );

    return (updateBook)
}

module.exports = {
    updateBuyBook
}