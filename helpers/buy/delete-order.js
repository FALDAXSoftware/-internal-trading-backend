var BuyBookModel = require("../../models/BuyBook");

var deleteOrder = async (id) => {
    var now = Date.now();

    await BuyBookModel
        .query()
        .where('deleted_at', null)
        .andWher('id', id)
        .patch({
            'deleted_at': now
        })

    return (1)
}

module.exports = {
    deleteOrder
}