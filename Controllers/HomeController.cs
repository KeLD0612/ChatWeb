using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using webchat.Models;

namespace webchat.Controllers
{
    public class HomeController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public HomeController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        [AllowAnonymous]
        public async Task<IActionResult> Index()
        {
            // Nếu là chưa đăng nhập, chuyển đến trang Landing
            if (!User.Identity.IsAuthenticated)
            {
                return View("Landing");
            }
            // Nếu đã đăng nhập, lấy thông tin người dùng hiện tại.
            // Nếu không tìm thấy user, trả về view "Landing".
            var currentUser = await _userManager.GetUserAsync(User);
            if (currentUser == null)
            {
                return View("Landing");
            }
            // Nếu tìm thấy user, truy vấn danh sách 10 người dùng khác (còn hoạt động) để gợi ý kết nối, truyền vào view "Explore"
            try
            {
                var usersToExplore = await _context.Users
                    .Where(u => u.Id != currentUser.Id && u.IsActive)
                    .Take(10)
                    .ToListAsync();

                ViewBag.CurrentUser = currentUser;
                return View("Explore", usersToExplore);
            }
            catch (Exception)
            {
                ViewBag.CurrentUser = currentUser;
                ViewBag.Message = "Chào mừng bạn đến với Dating App!";
                return View("Dashboard");
            }
        }
        // side word
        [AllowAnonymous]
        public IActionResult Privacy()
        {
            return View();
        }
    }
}
