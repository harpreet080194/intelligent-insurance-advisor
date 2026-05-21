import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', (table) => {
    table.uuid('user_id').primary();
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.boolean('mfa_enabled').defaultTo(false);
    table.string('mfa_secret', 255).nullable();
    table.json('profile').nullable();
    table.json('preferences').nullable();
    table.boolean('email_verified').defaultTo(false);
    table.string('email_verification_token', 255).nullable();
    table.timestamp('email_verified_at').nullable();
    table.string('password_reset_token', 255).nullable();
    table.timestamp('password_reset_expires').nullable();
    table.timestamp('last_login_at').nullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Indexes
    table.index('email');
    table.index('created_at');
    table.index('is_active');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('users');
}

// Made with Bob
