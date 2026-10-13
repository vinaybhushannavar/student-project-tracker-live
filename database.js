import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, {
  prepare: false, // Required for Supabase Transaction Pooler
  ssl: { rejectUnauthorized: false }
});

export { sql as db };
export default sql;