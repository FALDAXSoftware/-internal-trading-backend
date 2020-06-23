exports.seed = function (knex) {
  // Inserts seed entries

  return knex.schema
    .raw(`CREATE INDEX IF NOT EXISTS  indexcoins ON public.coins USING btree (coin, coin_name, coin_code)`)
};