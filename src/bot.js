const { Telegraf } = require('telegraf');
const config = require('./config');
const startHandler = require('./handlers/start.handler');
const contactHandler = require('./handlers/contact.handler');
const userMessageHandler = require('./handlers/userMessage.handler');
const adminReplyHandler = require('./handlers/adminReply.handler');
const adminOnly = require('./middlewares/adminOnly');
const ticketService = require('./services/ticket.service'); // Import service to use in actions

const bot = new Telegraf(process.env.BOT_TOKEN);
const CHANNEL = process.env.CHANNEL_ID;

bot.start(startHandler);
bot.on('contact', contactHandler);
bot.command('reply', adminOnly, adminReplyHandler);

// --- NEW ACTION HANDLERS FOR BUTTONS ---

// Handle "Approve" button
bot.action(/^approve_(\d+)$/, adminOnly, async (ctx) => {
    const ticketId = ctx.match[1];
    try {
        const ticket = await ticketService.getTicketById(ticketId);
        
        // 1. Send to User
        await ctx.telegram.sendMessage(ticket.user_id, `🎧 Admin javobi:\n\n${ticket.admin_reply}`);
        
        // 2. Send to Channel
        await ctx.telegram.sendMessage(CHANNEL, `📢 *Tasdiqlangan Javob*\n\n${ticket.admin_reply}`, { parse_mode: 'Markdown' });

        // 3. Update status and UI
        await ticketService.updateStatus(ticketId, 'posted');
        await ctx.editMessageText(`✅ Ticket #${ticketId} yuborildi va kanalga joylandi.`);
    } catch (err) {
        console.error(err);
        await ctx.answerCbQuery("Xatolik yuz berdi.");
    }
});

// Handle "Disapprove" button
bot.action(/^disapprove_(\d+)$/, adminOnly, async (ctx) => {
    const ticketId = ctx.match[1];
    await ctx.editMessageText(`❌ Ticket #${ticketId} bekor qilindi.`);
});



bot.on('text', userMessageHandler);

module.exports = { bot };
