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

// 1. Initial Start
bot.start(startHandler);

// 2. Handle the Phone Number share event
bot.on('contact', contactHandler);

// 3. Admin Command: /reply [id] [text] (Still kept for manual use)
bot.command('reply', adminOnly, adminReplyHandler);

// 4. NEW: Admin "Reply to message" detection
// This lets you respond just by replying to a user's message notification
bot.on('text', adminOnly, async (ctx, next) => {
    // Check if admin is replying to a message sent by the bot
    if (ctx.message.reply_to_message && ctx.message.reply_to_message.from.id === ctx.botInfo.id) {
        const replyToText = ctx.message.reply_to_message.text || "";
        
        // Regex to find ID: [ID] or ID: 12345
        const idMatch = replyToText.match(/ID:\s*`?(\d+)`?/i);
        
        if (idMatch) {
            const userId = idMatch[1];
            const adminMessage = ctx.message.text;

            try {
                const ticket = await ticketService.getOrCreateTicket(userId);
                
                // Show preview with Approve/Disapprove buttons
                return await ctx.reply(
                    `📝 **Tasdiqlash:**\n\n**Kimga:** \`${userId}\`\n**Xabar:** ${adminMessage}\n\nUshbu javobni tasdiqlaysizmi?`,
                    {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: "✅ Approve & Send", callback_data: `approve_${ticket.id}_${userId}` },
                                    { text: "❌ Disapprove", callback_data: `disapprove_${ticket.id}` }
                                ]
                            ]
                        }
                    }
                );
            } catch (err) {
                console.error("Reply detection error:", err);
            }
        }
    }
    // If it's not a reply, move to the next handler (userMessageHandler)
    return next();
});

// --- ACTION HANDLERS FOR BUTTONS ---

// Handle "Approve" button
bot.action(/^approve_(\d+)_(\d+)$/, adminOnly, async (ctx) => {
    const ticketId = ctx.match[1];
    const userId = ctx.match[2];
    
    try {
        // Extract message from the admin's preview text
        const fullText = ctx.callbackQuery.message.text;
        // Split by "Xabar: " and then take the text before the next double newline
        const messagePart = fullText.split('Xabar: ')[1];
        const messageText = messagePart.split('\n\n')[0];

        // 1. Send to User
        await ctx.telegram.sendMessage(userId, `🎧 *Admin javobi:* ${messageText}`, { parse_mode: 'Markdown' });
        
        // 2. Send to Channel
        await ctx.telegram.sendMessage(CHANNEL, `📢 *Yangi javob*\n\n${messageText}`, { parse_mode: 'Markdown' });

        // 3. Update status and UI
        await ticketService.updateStatus(ticketId, 'posted');
        await ctx.editMessageText(`✅ Xabar (ID: ${userId}) ga yuborildi va kanalga joylandi.`);
        await ctx.answerCbQuery("Yuborildi!");
    } catch (err) {
        console.error("Approve error:", err);
        await ctx.answerCbQuery("Xatolik yuz berdi.");
    }
});

// Handle "Disapprove" button
bot.action(/^disapprove_(\d+)$/, adminOnly, async (ctx) => {
    await ctx.editMessageText(`❌ Xabar rad etildi.`);
    await ctx.answerCbQuery("Bekor qilindi");
});

// 5. Catch-all for user messages (must be at the bottom)
bot.on('text', userMessageHandler);

module.exports = { bot };
