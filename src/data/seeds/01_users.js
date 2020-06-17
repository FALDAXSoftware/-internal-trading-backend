exports.seed = function (knex) {
  // Inserts seed entries

  return knex.schema
    .raw(`CREATE INDEX usersindexid ON public.users USING btree (id)`)
    .raw(`CREATE INDEX users_email ON public.users USING btree (email)`)
};