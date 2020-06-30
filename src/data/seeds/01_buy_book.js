exports.seed = function (knex) {
  // Inserts seed entries

  return knex.schema
    .raw(`CREATE INDEX IF NOT EXISTS  indexbuybook ON public.buy_book USING btree (settle_currency, currency, limit_price, quantity, deleted_at);`)
    .raw(`CREATE INDEX IF NOT EXISTS  indexbuybookquantity ON public.buy_book USING btree (deleted_at, quantity, limit_price, settle_currency, currency, price DESC NULLS LAST);`)
};

