const keyboards = require('../utils/keyboards');

module.exports = async (ctx) => {
  await ctx.reply(
    `Hello ${ctx.from.first_name}! Please share your number to start support.`,
    keyboards.contactRequest()
  );
};
