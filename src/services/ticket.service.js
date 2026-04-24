// src/services/ticket.service.js
const db = require('../db/knex');

module.exports = {
  async getOrCreateTicket(userId) {
    let ticket = await db('tickets').where({ user_id: userId, status: 'open' }).first();
    
    if (!ticket) {
      const [newTicket] = await db('tickets')
        .insert({ user_id: userId, status: 'open' })
        .returning('*');
      return newTicket;
    }
    return ticket;
  },

  async logMessage(ticketId, senderId, text) {
    // 1. Added 'await' to trigger the promise execution
    // 2. Added '.returning('*')' so PostgreSQL acknowledges the insert
    const [savedMessage] = await db('messages')
      .insert({
        ticket_id: ticketId,
        sender_id: senderId,
        text: text
      })
      .returning('*');
    
    return savedMessage;
  }
};
