// src/services/ticket.service.js
const db = require('../db/knex');

module.exports = {
  async getOrCreateTicket(userId) {
    let ticket = await db('tickets').where({ user_id: userId, status: 'open' }).first();
    
    if (!ticket) {
      // Use .returning('*') to get the inserted object back
      const [newTicket] = await db('tickets')
        .insert({ user_id: userId, status: 'open' })
        .returning('*');
      return newTicket;
    }
    return ticket;
  },

  async logMessage(ticketId, senderId, text) {
    return db('messages').insert({
      ticket_id: ticketId,
      sender_id: senderId,
      text: text
    }).returning('*');
  }
};
