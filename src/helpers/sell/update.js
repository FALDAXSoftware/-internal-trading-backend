var SellBookModel = require("../../models/SellBook");

var updateSellBook = async (id, data) => {
    // console.log(JSON.stringify(data));
    var updatedBook = await SellBookModel
        .query()
        .where('deleted_at', null)
        .andWhere('id', id)
        .update(data);

    updatedBook = await SellBookModel
        .query()
        .where('deleted_at', null)
        .andWhere('id', id)
    console.log("updatedBook", updatedBook)

    return (updatedBook);
}

module.exports = {
    updateSellBook
}