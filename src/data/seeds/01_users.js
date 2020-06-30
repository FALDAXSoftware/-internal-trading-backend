exports.seed = function (knex) {
  // Inserts seed entries

  return knex.schema
    .raw(`CREATE INDEX IF NOT EXISTS usersindexid ON public.users USING btree (id)`)
    .raw(`CREATE INDEX IF NOT EXISTS users_email ON public.users USING btree (email)`)
};