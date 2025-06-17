using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using webchat.Models;

namespace webchat.Controllers
{
    [Authorize(Roles = "Admin")]
    public class DashboardController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public DashboardController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        public async Task<IActionResult> Index()
        {
            try
            {
                var today = DateTime.Today;
                var stats = new AdminDashboardViewModel
                {
                    TotalUsers = await _context.Users.CountAsync(u => u.IsActive),
                    TotalMessages = await _context.Messages.CountAsync(),
                    TotalMatches = await _context.Matches.CountAsync(m => m.Status == "Active"),
                    TotalReports = await _context.Reports.CountAsync(),
                    ActiveUsers = await _context.Users.CountAsync(u => u.IsActive),
                    NewUsersToday = await _context.Users.CountAsync(u => u.CreatedAt.Date == today),
                    MessagesToday = await _context.Messages.CountAsync(m => m.SentAt.Date == today),
                    LikesToday = await _context.Likes.CountAsync(l => l.CreatedAt.Date == today),
                    PendingReports = await _context.Reports.CountAsync(r => r.Status == "Pending")
                };

                // Get daily stats for the last 7 days
                var last7Days = Enumerable.Range(0, 7)
                    .Select(i => today.AddDays(-i))
                    .ToList();

                stats.DailyStats = new List<DailyStats>();
                foreach (var date in last7Days)
                {
                    var dailyStat = new DailyStats
                    {
                        Date = date,
                        NewUsers = await _context.Users.CountAsync(u => u.CreatedAt.Date == date),
                        Messages = await _context.Messages.CountAsync(m => m.SentAt.Date == date),
                        Matches = await _context.Matches.CountAsync(m => m.MatchedAt.Date == date),
                        Likes = await _context.Likes.CountAsync(l => l.CreatedAt.Date == date)
                    };
                    stats.DailyStats.Add(dailyStat);
                }

                // Get user growth stats for the last 6 months
                var last6Months = Enumerable.Range(0, 6)
                    .Select(i => today.AddMonths(-i))
                    .ToList();

                stats.UserGrowthStats = new List<UserGrowthStats>();
                foreach (var month in last6Months)
                {
                    var monthStart = new DateTime(month.Year, month.Month, 1);
                    var monthEnd = monthStart.AddMonths(1).AddDays(-1);

                    var growthStat = new UserGrowthStats
                    {
                        Month = month.ToString("MM/yyyy"),
                        UserCount = await _context.Users.CountAsync(u => u.CreatedAt >= monthStart && u.CreatedAt <= monthEnd),
                        ActiveUserCount = await _context.Users.CountAsync(u => u.CreatedAt >= monthStart && u.CreatedAt <= monthEnd && u.IsActive)
                    };
                    stats.UserGrowthStats.Add(growthStat);
                }

                return View(stats);
            }
            catch (Exception ex)
            {
                // Log error và return view với data mặc định
                var defaultStats = new AdminDashboardViewModel
                {
                    TotalUsers = 0,
                    TotalMessages = 0,
                    TotalMatches = 0,
                    TotalReports = 0,
                    ActiveUsers = 0,
                    NewUsersToday = 0,
                    MessagesToday = 0,
                    LikesToday = 0,
                    PendingReports = 0
                };

                ViewBag.Error = "Không thể tải dữ liệu dashboard: " + ex.Message;
                return View(defaultStats);
            }
        }

        [HttpGet]
        public async Task<IActionResult> Users(int page = 1, int pageSize = 10, string search = "")
        {
            var query = _context.Users.AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(u => u.FullName.Contains(search) || u.Email.Contains(search));
            }

            var totalUsers = await query.CountAsync();
            var users = await query
                .OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            ViewBag.CurrentPage = page;
            ViewBag.TotalPages = (int)Math.Ceiling((double)totalUsers / pageSize);
            ViewBag.Search = search;

            return View(users);
        }

        [HttpGet]
        public async Task<IActionResult> Reports(int page = 1, int pageSize = 10)
        {
            var reports = await _context.Reports
                .Include(r => r.Reporter)
                .Include(r => r.ReportedUser)
                .Include(r => r.ReportedMessage)
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var totalReports = await _context.Reports.CountAsync();

            ViewBag.CurrentPage = page;
            ViewBag.TotalPages = (int)Math.Ceiling((double)totalReports / pageSize);

            return View(reports);
        }

        [HttpPost]
        public async Task<IActionResult> ResolveReport(int reportId, string action)
        {
            var report = await _context.Reports.FindAsync(reportId);
            if (report == null)
            {
                return NotFound();
            }

            report.Status = action == "resolve" ? "Resolved" : "Dismissed";
            await _context.SaveChangesAsync();

            return RedirectToAction(nameof(Reports));
        }

        [HttpPost]
        public async Task<IActionResult> ToggleUserStatus(string userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound();
            }

            user.IsActive = !user.IsActive;
            await _context.SaveChangesAsync();

            return RedirectToAction(nameof(Users));
        }

        [HttpGet]
        public async Task<IActionResult> GetStatsData()
        {
            var today = DateTime.Today;
            var stats = new
            {
                totalUsers = await _context.Users.CountAsync(u => u.IsActive),
                totalMessages = await _context.Messages.CountAsync(),
                totalMatches = await _context.Matches.CountAsync(),
                newUsersToday = await _context.Users.CountAsync(u => u.CreatedAt.Date == today),
                messagesThisWeek = await _context.Messages.CountAsync(m => m.SentAt >= today.AddDays(-7))
            };

            return Json(stats);
        }
    }
}
