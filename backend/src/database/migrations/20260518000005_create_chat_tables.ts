import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create chat_sessions table
  await knex.schema.createTable('chat_sessions', (table) => {
    table.uuid('session_id').primary();
    table.uuid('user_id').notNullable().references('user_id').inTable('users').onDelete('CASCADE');
    table.string('status', 20).notNullable().defaultTo('ACTIVE');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('user_id');
    table.index('status');
    table.index('updated_at');
  });

  // Create chat_messages table
  await knex.schema.createTable('chat_messages', (table) => {
    table.uuid('message_id').primary();
    table.uuid('session_id').notNullable().references('session_id').inTable('chat_sessions').onDelete('CASCADE');
    table.string('role', 20).notNullable();
    table.text('content').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('session_id');
    table.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('chat_messages');
  await knex.schema.dropTableIfExists('chat_sessions');
}

// Made with Bob
