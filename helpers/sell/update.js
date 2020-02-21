var SellBookModel = require("../../models/SellBook");

var updateSellBook = async (id, data) => {
    var updatedBook = await SellBookModel
        .query()
        .where('deleted_at', null)
        .andWhere('id', id)
        .updateAndFetch(data);

    return (updatedBook);
}

module.exports = {
    updateSellBook
}