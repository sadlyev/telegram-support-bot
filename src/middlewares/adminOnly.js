// src/middlewares/adminOnly.js
module.exports = async (ctx, next) => {
  const adminId = Number(process.env.ADMIN_ID);
  if (ctx.from.id !== adminId) {
    return ctx.reply("Access denied. Admins only.");
  }
  return next();
};
