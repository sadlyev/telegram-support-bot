exports.up = function(knex) {
  return knex.schema
    .createTable('users', (table) => {
      table.bigInteger('telegram_id').primary().unique();
      table.string('first_name');
      table.string('phone_number'); // Added for your requirement
      table.boolean('is_registered').defaultTo(false); // To track if they shared the number
      table.timestamps(true, true);
    })
    .createTable('tickets', (table) => {
      table.increments('id').primary();
      table.bigInteger('user_id').references('telegram_id').inTable('users');
      table.enum('status', ['open', 'closed']).defaultTo('open');
      table.timestamps(true, true);
    })
    .createTable('messages', (table) => {
      table.increments('id').primary();
      table.integer('ticket_id').references('id').inTable('tickets');
      table.bigInteger('sender_id'); 
      table.text('text');
      table.timestamps(true, true);
    });
};

exports.down = (knex) => knex.schema.dropTable('messages').dropTable('tickets').dropTable('users');
