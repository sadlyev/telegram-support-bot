module.exports = (ctx, next) => {
  console.log(`[BOT] New Update from ${ctx.from.id}: ${ctx.message?.text || 'Non-text'}`);
  return next();
};