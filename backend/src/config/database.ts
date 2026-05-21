import knex from 'knex';

const db = knex({
  client: 'sqlite3',
  connection: {
    filename: 'dev.sqlite3',
  },
  useNullAsDefault: true,
});

db.raw('SELECT 1').catch((error) => {
  console.error('Database connection failed:', error);
});

export default db;

// Made with Bob
