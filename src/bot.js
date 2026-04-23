const { Telegraf } = require('telegraf');
const config = require('./config');
const startHandler = require('./handlers/start.handler');
const contactHandler = require('./handlers/contact.handler');
const userMessageHandler = require('./handlers/userMessage.handler');
const adminReplyHandler = require('./handlers/adminReply.handler');
const adminOnly = require('./middlewares/adminOnly');
const ticketService = require('./services/ticket.service');

const bot = new Telegraf(process.env.BOT_TOKEN);
const CHANNEL = process.env.CHANNEL_ID;

bot.start(startHandler);
bot.on('contact', contactHandler);
bot.command('reply', adminOnly, adminReplyHandler);

// --- ACTION HANDLERS FOR BUTTONS ---

// Handle "Approve" button
bot.action(/^approve_(\d+)_(\d+)$/, adminOnly, async (ctx) => {
    const ticketId = ctx.match[1];
    const userId = ctx.match[2];
    
    try {
        // Extract message from the admin's preview text
        const fullText = ctx.callbackQuery.message.text;
        const messageText = fullText.split('Xabar: ')[1].split('\n\n')[0];

        // 1. Send to User
        await ctx.telegram.sendMessage(userId, `🎧 *Admin javobi:* ${messageText}`, { parse_mode: 'Markdown' });
        
        // 2. Send to Channel
        await ctx.telegram.sendMessage(CHANNEL, `📢 *Yangi javob*\n\n${messageText}`, { parse_mode: 'Markdown' });

        // 3. Update status and UI
        await ticketService.updateStatus(ticketId, 'posted');
        await ctx.editMessageText(`✅ Xabar (ID: ${userId}) ga yuborildi va kanalga joylandi.`);
        await ctx.answerCbQuery("Yuborildi!");
    } catch (err) {
        console.error(err);
        await ctx.answerCbQuery("Xatolik yuz berdi.");
    }
});

// Handle "Disapprove" button
bot.action(/^disapprove_(\d+)$/, adminOnly, async (ctx) => {
    await ctx.editMessageText(`❌ Xabar rad etildi.`);
    await ctx.answerCbQuery("Bekor qilindi");
});

bot.on('text', userMessageHandler);

module.exports = { bot };
