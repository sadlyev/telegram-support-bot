// src/handlers/adminReply.handler.js
const ticketService = require('../services/ticket.service');

module.exports = async (ctx) => {
  const args = ctx.message.text.split(' ');
  const targetId = args[1]; // Foydalanuvchi IDsi
  const message = args.slice(2).join(' ');

  if (!targetId || !message) {
    return ctx.reply("Foydalanish formati: /reply [UserID] [Xabar]");
  }

  try {
    // Foydalanuvchiga yuboriladigan xabar
    await ctx.telegram.sendMessage(targetId, `🎧 *Admin javobi:* ${message}`, { parse_mode: 'Markdown' });
    
    // Bazaga saqlash
    const ticket = await ticketService.getOrCreateTicket(targetId);
    await ticketService.logMessage(ticket.id, ctx.from.id, message);
    
    await ctx.reply(`Xabar foydalanuvchiga (ID: ${targetId}) yuborildi.`);
  } catch (err) {
    console.error(err);
    await ctx.reply("Xabarni yuborib bo'lmadi. User ID to'g'ri ekanligini tekshiring.");
  }
};
