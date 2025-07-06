using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using webchat.Models;

namespace webchat.Middleware
{
    public class UserBanCheckMiddleware
    {
        private readonly RequestDelegate _next;

        public UserBanCheckMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, ApplicationDbContext dbContext, UserManager<ApplicationUser> userManager)
        {
            // 🚨 QUAN TRỌNG: BỎ QUA CÁC TRANG KHÔNG CẦN KIỂM TRA
            var path = context.Request.Path.Value?.ToLower();
            var excludedPaths = new[]
            {
                "/account/banned",           // Trang bị ban
                "/account/logout",           // Logout
                "/account/login",            // Login  
                "/account/register",         // Register
                "/admin",                    // Admin area
                "/identity",                 // Identity pages
                "/health",                   // Health check
                "/_",                        // SignalR và static files
                "/css",                      // CSS files
                "/js",                       // JS files
                "/lib",                      // Library files
                "/images",                   // Images
                "/favicon"                   // Favicon
            };

            // Nếu là static files hoặc excluded paths thì không kiểm tra
            if (excludedPaths.Any(ep => path?.StartsWith(ep) == true))
            {
                await _next(context);
                return;
            }

            // Chỉ kiểm tra cho user đã đăng nhập
            if (context.User.Identity.IsAuthenticated)
            {
                var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (!string.IsNullOrEmpty(userId))
                {
                    var user = await dbContext.Users.FindAsync(userId);

                    if (user != null)
                    {
                        // Kiểm tra ban vĩnh viễn
                        if (user.IsPermanentlyBanned)
                        {
                            await HandleBannedUser(context, "🚫 Tài khoản của bạn đã bị khóa vĩnh viễn", user.BanReason);
                            return;
                        }

                        // Kiểm tra ban tạm thời
                        if (user.BannedAt.HasValue && user.BanExpiresAt.HasValue)
                        {
                            if (DateTime.Now < user.BanExpiresAt.Value)
                            {
                                var timeLeft = user.BanExpiresAt.Value - DateTime.Now;
                                var message = $"⏰ Tài khoản bị khóa đến {user.BanExpiresAt.Value:dd/MM/yyyy HH:mm}. Còn lại: {timeLeft.Days} ngày {timeLeft.Hours} giờ";
                                await HandleBannedUser(context, message, user.BanReason);
                                return;
                            }
                            else
                            {
                                // Hết hạn ban - tự động mở khóa
                                user.IsActive = true;
                                user.BannedAt = null;
                                user.BanExpiresAt = null;
                                user.BanReason = string.Empty;
                                await dbContext.SaveChangesAsync();

                                // Continue normal flow sau khi mở khóa
                            }
                        }

                        // Kiểm tra user không active
                        if (!user.IsActive && !user.BannedAt.HasValue)
                        {
                            await HandleBannedUser(context, "⚠️ Tài khoản của bạn đã bị vô hiệu hóa", user.BanReason);
                            return;
                        }

                        // Kiểm tra warning chưa đọc (không chặn, chỉ lưu session)
                        var unreadWarnings = await dbContext.UserWarnings
                            .Where(w => w.UserId == userId && w.IsActive && !w.AcknowledgedAt.HasValue)
                            .ToListAsync();

                        if (unreadWarnings.Any())
                        {
                            // Lưu warnings vào session để hiển thị popup
                            context.Session.SetString("UnreadWarnings", System.Text.Json.JsonSerializer.Serialize(
                                unreadWarnings.Select(w => new { w.WarningId, w.Warning, w.CreatedAt }).ToList()
                            ));
                        }
                    }
                }
            }

            await _next(context);
        }

        private async Task HandleBannedUser(HttpContext context, string message, string reason)
        {
            // 🚨 KIỂM TRA TRÁNH REDIRECT LOOP
            if (context.Request.Path.StartsWithSegments("/Account/Banned"))
            {
                await _next(context);
                return;
            }

            // Nếu là AJAX request, trả về JSON
            if (context.Request.Headers["X-Requested-With"] == "XMLHttpRequest" ||
                context.Request.Headers["Content-Type"].ToString().Contains("application/json"))
            {
                context.Response.StatusCode = 403;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(new
                {
                    success = false,
                    banned = true,
                    message = message,
                    reason = reason
                }));
                return;
            }

            // Nếu là request bình thường, redirect đến trang ban
            var encodedMessage = Uri.EscapeDataString(message);
            var encodedReason = Uri.EscapeDataString(reason ?? "");
            context.Response.Redirect($"/Account/Banned?message={encodedMessage}&reason={encodedReason}");
        }
    }
}