module.exports = async (ctx, next) => {
  const adminId = process.env.ADMIN_ID;

  // Use == to allow string-to-number comparison
  if (ctx.from.id == adminId) {
    return next();
  }

  // This log will tell you exactly what is wrong in the Render "Logs" tab
  console.log(`[AUTH] Denied! Your ID: ${ctx.from.id} | Allowed ID: ${adminId}`);
  return ctx.reply("Access denied. Admins only.");
};