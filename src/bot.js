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

// 3. Admin Command: /reply [id] [text]
bot.command('reply', adminOnly, adminReplyHandler);

// 4. Admin "Reply to message" detection
// This triggers when you swipe-right and reply to a user's message notification
bot.on('text', adminOnly, async (ctx, next) => {
    if (ctx.message.reply_to_message && ctx.message.reply_to_message.from.id === ctx.botInfo.id) {
        const replyToText = ctx.message.reply_to_message.text || "";
        
        // Extract ID from the notification text (looks for ID: 12345)
        const idMatch = replyToText.match(/ID:\s*`?(\d+)`?/i);
        
        if (idMatch) {
            const userId = idMatch[1];
            const adminMessage = ctx.message.text;

            try {
                const ticket = await ticketService.getOrCreateTicket(userId);
                
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
    return next();
});

// --- ACTION HANDLERS FOR BUTTONS ---

bot.action(/^approve_(\d+)_(\d+)$/, adminOnly, async (ctx) => {
    const ticketId = ctx.match[1];
    const userId = ctx.match[2];
    
    try {
        // 1. Extract message text from the preview
        const fullText = ctx.callbackQuery.message.text;
        const messagePart = fullText.split('Xabar: ')[1];
        if (!messagePart) throw new Error("Xabar matni topilmadi");
        const messageText = messagePart.split('\n\n')[0];

        // 2. Send to Channel (Usually succeeds)
        await ctx.telegram.sendMessage(CHANNEL, `📢 *Yangi javob*\n\n${messageText}`, { parse_mode: 'Markdown' });
        
        // 3. Send to User (Might fail if user blocked bot)
        let userNotified = true;
        try {
            await ctx.telegram.sendMessage(userId, `🎧 *Admin javobi:* ${messageText}`, { parse_mode: 'Markdown' });
        } catch (userErr) {
            console.error(`User ${userId} message failed:`, userErr.message);
            userNotified = false;
        }

        // 4. Update Database Status
        if (ticketService.updateStatus) {
            await ticketService.updateStatus(ticketId, 'posted');
        }

        // 5. Final UI Update
        if (userNotified) {
            await ctx.editMessageText(`✅ Muvaffaqiyatli: Kanalga joylandi va foydalanuvchiga yuborildi.`);
        } else {
            await ctx.editMessageText(`⚠️ Kanalga yuborildi, lekin foydalanuvchi botni bloklagan (ID: ${userId}).`);
        }
        
        await ctx.answerCbQuery("Bajarildi!");

    } catch (err) {
        console.error("Approve handler error:", err);
        await ctx.answerCbQuery("Xatolik: " + err.message);
    }
});

bot.action(/^disapprove_(\d+)$/, adminOnly, async (ctx) => {
    await ctx.editMessageText(`❌ Xabar bekor qilindi.`);
    await ctx.answerCbQuery("Bekor qilindi");
});

// 5. Catch-all for user messages
bot.on('text', userMessageHandler);

module.exports = { bot };
