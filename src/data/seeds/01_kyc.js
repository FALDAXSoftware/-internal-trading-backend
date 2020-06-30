exports.seed = function (knex) {
  // Inserts seed entries

  return knex.schema
    .raw(`CREATE INDEX IF NOT EXISTS  kyc_id ON public.kyc USING btree (user_id)`)
};