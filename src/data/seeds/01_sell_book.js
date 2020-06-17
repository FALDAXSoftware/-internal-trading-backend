exports.seed = function (knex) {
  // Inserts seed entries

  return knex.schema
    .raw(`CREATE INDEX indexsellbook ON public.sell_book USING btree (limit_price, quantity, currency, settle_currency, deleted_at, price);`)
    .raw(`CREATE INDEX indexsellbookquantity ON public.sell_book USING btree (deleted_at, quantity, limit_price, settle_currency, currency);`)
};
