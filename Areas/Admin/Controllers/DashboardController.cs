// Areas/Admin/Controllers/DashboardController.cs (Cập nhật)
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using webchat.Models;

namespace webchat.Areas.Admin.Controllers
{
    [Area("Admin")]
    [Authorize(Roles = "Admin")]
    public class DashboardController : Controller
    {
        private readonly ApplicationDbContext _context;

        public DashboardController(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            var today = DateTime.Today;
            var thisWeek = today.AddDays(-7);
            var thisMonth = new DateTime(today.Year, today.Month, 1);

            var dashboardData = new AdminDashboardViewModel
            {
                TotalUsers = await _context.Users.CountAsync(),
                TotalMessages = await _context.Messages.CountAsync(),
                ActiveUsers = await _context.Users.CountAsync(u => u.IsActive),
                TotalMatches = await _context.Matches.CountAsync(),
                TotalReports = await _context.Reports.CountAsync(),
                NewUsersToday = await _context.Users.CountAsync(u => u.CreatedAt.Date == today),
                MessagesToday = await _context.Messages.CountAsync(m => m.SentAt.Date == today),
                LikesToday = await _context.Likes.CountAsync(l => l.CreatedAt.Date == today),
                PendingReports = await _context.Reports.CountAsync(r => r.Status == "Pending")
            };

            // Thống kê theo ngày (7 ngày gần nhất)
            dashboardData.DailyStats = await GetDailyStats(7);

            // Thống kê tăng trưởng user (6 tháng gần nhất)
            dashboardData.UserGrowthStats = await GetUserGrowthStats(6);

            return View(dashboardData);
        }

        private async Task<List<DailyStats>> GetDailyStats(int days)
        {
            var stats = new List<DailyStats>();

            for (int i = days - 1; i >= 0; i--)
            {
                var date = DateTime.Today.AddDays(-i);
                var dailyStat = new DailyStats
                {
                    Date = date,
                    NewUsers = await _context.Users.CountAsync(u => u.CreatedAt.Date == date),
                    Messages = await _context.Messages.CountAsync(m => m.SentAt.Date == date),
                    Matches = await _context.Matches.CountAsync(m => m.MatchedAt.Date == date),
                    Likes = await _context.Likes.CountAsync(l => l.CreatedAt.Date == date)
                };
                stats.Add(dailyStat);
            }

            return stats;
        }

        private async Task<List<UserGrowthStats>> GetUserGrowthStats(int months)
        {
            var stats = new List<UserGrowthStats>();

            for (int i = months - 1; i >= 0; i--)
            {
                var date = DateTime.Today.AddMonths(-i);
                var startOfMonth = new DateTime(date.Year, date.Month, 1);
                var endOfMonth = startOfMonth.AddMonths(1).AddDays(-1);

                var monthlyStat = new UserGrowthStats
                {
                    Month = date.ToString("MM/yyyy"),
                    UserCount = await _context.Users.CountAsync(u => u.CreatedAt <= endOfMonth),
                    ActiveUserCount = await _context.Users.CountAsync(u => u.CreatedAt <= endOfMonth && u.IsActive)
                };
                stats.Add(monthlyStat);
            }

            return stats;
        }

        [HttpGet]
        public async Task<IActionResult> GetRealTimeStats()
        {
            var stats = new
            {
                TotalUsers = await _context.Users.CountAsync(),
                TotalMessages = await _context.Messages.CountAsync(),
                ActiveUsers = await _context.Users.CountAsync(u => u.IsActive),
                PendingReports = await _context.Reports.CountAsync(r => r.Status == "Pending"),
                OnlineUsers = 0, // Implement với SignalR
                LastUpdate = DateTime.Now.ToString("HH:mm:ss")
            };

            return Json(stats);
        }

        // API cho charts
        [HttpGet]
        public async Task<IActionResult> GetChartData(string type)
        {
            switch (type.ToLower())
            {
                case "daily":
                    return Json(await GetDailyStats(7));
                case "growth":
                    return Json(await GetUserGrowthStats(6));
                case "messages":
                    return Json(await GetMessageTypeStats());
                default:
                    return BadRequest();
            }
        }

        private async Task<object> GetMessageTypeStats()
        {
            return new
            {
                Text = await _context.Messages.CountAsync(m => m.MessageType == "text"),
                Image = await _context.Messages.CountAsync(m => m.MessageType == "image"),
                Video = await _context.Messages.CountAsync(m => m.MessageType == "video")
            };
        }
    }
}
