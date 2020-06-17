exports.seed = function (knex) {
  // Inserts seed entries

  return knex.schema
    .raw(`CREATE INDEX indexcurrencyconversions ON public.currency_conversion USING btree (coin_id, symbol, coin_name)`)
};