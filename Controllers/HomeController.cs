using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
            if (!User.Identity.IsAuthenticated)
            {
                return View("Landing");
            }

            var currentUser = await _userManager.GetUserAsync(User);
            if (currentUser == null)
            {
                return View("Landing");
            }

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
        [Authorize]
        public async Task<IActionResult> Explore()
        {
            var currentUser = await _userManager.GetUserAsync(User);
            if (currentUser == null)
            {
                return RedirectToAction("Login", "Account", new { area = "Identity" });
            }

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

        [AllowAnonymous]
        public IActionResult Privacy()
        {
            return View();
        }
    }
}
