var BuyBookModel = require("../../models/BuyBook");

var updateBuyBook = async (id, orderData) => {
    var updateBook = await BuyBookModel
        .query()
        .where('id', id)
        .updateAndFetch({
            orderData
        });

    return (updateBook)
}

module.exports = {
    updateBuyBook
}