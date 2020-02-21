var SellBookModel = require("../../models/SellBook");

var deleteSellOrder = async (id) => {
    let now = Date.now();

    var details = await SellBookModel
        .query()
        .where('deleted_at', null)
        .andWhere('id', id)
        .updateAndFetch({
            deleted_at: now
        });

    return deleteSellOrder;
}

module.exports = {
    deleteSellOrder
}