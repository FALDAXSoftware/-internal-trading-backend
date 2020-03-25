var BuyBookModel = require("../../models/BuyBook");

var deleteOrder = async (id) => {
    var now = new Date();

    await BuyBookModel
        .query()
        .where('deleted_at', null)
        .andWhere('id', id)
        .patch({
            'deleted_at': now
        })

    return (1)
}

module.exports = {
    deleteOrder
}