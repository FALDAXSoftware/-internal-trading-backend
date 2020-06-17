exports.seed = function (knex) {
  // Inserts seed entries

  return knex.schema
    .raw(`CREATE INDEX indexcoins ON public.coins USING btree (coin, coin_name, coin_code)`)
};