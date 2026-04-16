// src/handlers/adminReply.handler.js
const ticketService = require('../services/ticket.service');

module.exports = async (ctx) => {
  const args = ctx.message.text.split(' ');
  const targetId = args[1]; // The User ID
  const message = args.slice(2).join(' ');

  if (!targetId || !message) {
    return ctx.reply("Usage: /reply [UserID] [Message]");
  }

  try {
    await ctx.telegram.sendMessage(targetId, `🎧 *Support:* ${message}`, { parse_mode: 'Markdown' });
    
    // Log to DB
    const ticket = await ticketService.getOrCreateTicket(targetId);
    await ticketService.logMessage(ticket.id, ctx.from.id, message);
    
    await ctx.reply(`Message sent to user ${targetId}`);
  } catch (err) {
    console.error(err);
    await ctx.reply("Failed to send message. Is the User ID correct?");
  }
};
