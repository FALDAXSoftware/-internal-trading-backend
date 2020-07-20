var SellBookModel = require("../../models/SellBook");

var deleteSellOrder = async (id) => {
    let now = new Date();

    var details = await SellBookModel
        .query()
        .where('deleted_at', null)
        .andWhere('id', id)
        .update({
            deleted_at: now
        });

    return 1;
}

module.exports = {
    deleteSellOrder
}