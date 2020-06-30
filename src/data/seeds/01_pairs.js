exports.seed = function (knex) {
  // Inserts seed entries

  return knex.schema
    .raw(`CREATE INDEX IF NOT EXISTS  indexpairs ON public.pairs USING btree (name, symbol)`)
};