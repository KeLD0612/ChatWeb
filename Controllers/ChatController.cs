using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Extensions;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using webchat.Models;

namespace webchat.Controllers
{
    [Authorize]
    public class ChatController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<ChatController> _logger;

        public ChatController(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            ILogger<ChatController> logger)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
        }

        public async Task<IActionResult> Index(string userId = null, string userName = null)
        {
            _logger.LogInformation($"=== ChatController.Index DEBUG START ===");
            _logger.LogInformation($"Received userId: '{userId ?? "null"}'");
            _logger.LogInformation($"Received userName: '{userName ?? "null"}'");
            _logger.LogInformation($"Request URL: {Request.GetDisplayUrl()}");
            _logger.LogInformation($"Query String: {Request.QueryString}");

            try
            {
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    _logger.LogWarning("Current user is null, redirecting to login");
                    return RedirectToAction("Login", "Account", new { area = "Identity" });
                }

                _logger.LogInformation($"Current user: {currentUser.GetDisplayName()} (ID: {currentUser.Id})");

                // Enhanced query với detailed logging
                _logger.LogInformation("Querying users from database...");
                var users = await _context.Users
                    .Where(u => u.Id != currentUser.Id)
                    .Where(u => !string.IsNullOrEmpty(u.Email))
                    .OrderBy(u => u.FullName ?? u.Email)
                    .ToListAsync();

                _logger.LogInformation($"Found {users.Count} users for chat list");

                // DEBUG: Log all users với detailed info
                _logger.LogInformation("=== ALL USERS IN DATABASE ===");
                foreach (var user in users)
                {
                    _logger.LogInformation($"User: ID='{user.Id}', DisplayName='{user.GetDisplayName()}'");
                }

                // Enhanced user validation
                if (!string.IsNullOrEmpty(userId))
                {
                    _logger.LogInformation($"=== TARGET USER VALIDATION ===");
                    _logger.LogInformation($"Looking for userId: '{userId}'");

                    var targetUser = users.FirstOrDefault(u => u.Id == userId);
                    if (targetUser != null)
                    {
                        _logger.LogInformation($"✅ Target user found in filtered list:");
                        _logger.LogInformation($"   ID: '{targetUser.Id}'");
                        _logger.LogInformation($"   DisplayName: '{targetUser.GetDisplayName()}'");
                    }
                    else
                    {
                        _logger.LogWarning($"⚠️ Target user NOT found in filtered list");

                        // Search in entire database
                        _logger.LogInformation("Searching in entire database...");
                        var userInDb = await _userManager.FindByIdAsync(userId);
                        if (userInDb != null)
                        {
                            _logger.LogInformation($"✅ Found user in database:");
                            _logger.LogInformation($"   ID: '{userInDb.Id}'");
                            _logger.LogInformation($"   DisplayName: '{userInDb.GetDisplayName()}'");
                            _logger.LogInformation($"   EmailConfirmed: {userInDb.EmailConfirmed}");
                            _logger.LogInformation($"   LockoutEnabled: {userInDb.LockoutEnabled}");

                            // Add to users list if not already present
                            if (!users.Any(u => u.Id == userInDb.Id))
                            {
                                users.Add(userInDb);
                                _logger.LogInformation("✅ Added user to chat list");
                            }
                        }
                        else
                        {
                            _logger.LogError($"❌ User not found anywhere in database: '{userId}'");

                            // Search by partial match
                            _logger.LogInformation("Attempting partial match search...");
                            var partialMatches = await _context.Users
                                .Where(u => u.Id.Contains(userId) ||
                                           (u.Email != null && u.Email.Contains(userId)))
                                .ToListAsync();

                            if (partialMatches.Any())
                            {
                                _logger.LogInformation($"Found {partialMatches.Count} partial matches:");
                                foreach (var match in partialMatches)
                                {
                                    _logger.LogInformation($"   Partial match: ID='{match.Id}', DisplayName='{match.GetDisplayName()}'");
                                }
                            }

                            // Clear invalid userId
                            userId = null;
                            userName = null;
                            _logger.LogInformation("Cleared invalid userId and userName");
                        }
                    }
                }

                // Enhanced userName processing
                if (!string.IsNullOrEmpty(userName))
                {
                    _logger.LogInformation($"=== USERNAME PROCESSING ===");
                    _logger.LogInformation($"Original userName: '{userName}'");

                    try
                    {
                        var decodedUserName = Uri.UnescapeDataString(userName);
                        _logger.LogInformation($"Decoded userName: '{decodedUserName}'");

                        // Validate decoded name matches any user
                        var userByName = users.FirstOrDefault(u =>
                            u.GetDisplayName() == decodedUserName);

                        if (userByName != null)
                        {
                            _logger.LogInformation($"✅ Found user by name: {userByName.GetDisplayName()}");
                            userId = userByName.Id; // Auto-select based on name
                        }
                        else
                        {
                            _logger.LogWarning($"⚠️ No user found matching userName: '{decodedUserName}'");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Error decoding userName: '{userName}'");
                    }
                }

                // Prepare ViewBag với validation
                ViewBag.CurrentUser = currentUser;
                ViewBag.SelectedUserId = userId ?? string.Empty;
                ViewBag.SelectedUserName = !string.IsNullOrEmpty(userName) ?
                    Uri.UnescapeDataString(userName) : (userId != null ? users.FirstOrDefault(u => u.Id == userId)?.GetDisplayName() ?? string.Empty : string.Empty);

                // DEBUG: Log ViewBag values
                _logger.LogInformation($"=== VIEWBAG VALUES ===");
                _logger.LogInformation($"ViewBag.SelectedUserId: '{ViewBag.SelectedUserId}'");
                _logger.LogInformation($"ViewBag.SelectedUserName: '{ViewBag.SelectedUserName}'");
                _logger.LogInformation($"ViewBag.CurrentUser.Id: '{ViewBag.CurrentUser.Id}'");

                // Final validation
                if (!string.IsNullOrEmpty(userId))
                {
                    _logger.LogInformation($"✅ Will auto-select user: {ViewBag.SelectedUserName} (ID: {ViewBag.SelectedUserId})");
                }
                else
                {
                    _logger.LogInformation("ℹ️ No auto-select will occur");
                }

                _logger.LogInformation($"=== ChatController.Index DEBUG END ===");
                return View(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error in ChatController.Index");

                ViewBag.CurrentUser = await _userManager.GetUserAsync(User);
                ViewBag.SelectedUserId = string.Empty;
                ViewBag.SelectedUserName = string.Empty;
                ViewBag.ErrorMessage = "Không thể tải danh sách người dùng: " + ex.Message;

                return View(new List<ApplicationUser>());
            }
        }

        [HttpGet]
        public async Task<IActionResult> StartChat(string userId)
        {
            _logger.LogInformation($"=== StartChat DEBUG START ===");
            _logger.LogInformation($"Received userId: '{userId ?? "null"}'");
            _logger.LogInformation($"Request URL: {Request.GetDisplayUrl()}");

            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("StartChat called with empty userId");
                return RedirectToAction("Index");
            }

            try
            {
                _logger.LogInformation($"Searching for user with ID: '{userId}'");
                var targetUser = await _userManager.FindByIdAsync(userId);

                if (targetUser == null)
                {
                    _logger.LogWarning($"❌ Target user not found in StartChat: '{userId}'");

                    // Try alternative search methods
                    _logger.LogInformation("Trying alternative search methods...");

                    // Search by email
                    var userByEmail = await _userManager.FindByEmailAsync(userId);
                    if (userByEmail != null)
                    {
                        _logger.LogInformation($"✅ Found user by email: {userByEmail.Id}");
                        targetUser = userByEmail;
                    }
                    else
                    {
                        // Search in database directly
                        targetUser = await _context.Users
                            .FirstOrDefaultAsync(u => u.Id == userId || u.Email == userId);

                        if (targetUser != null)
                        {
                            _logger.LogInformation($"✅ Found user in database: {targetUser.GetDisplayName()}");
                        }
                    }
                }

                if (targetUser == null)
                {
                    _logger.LogError($"❌ User not found with any method: '{userId}'");
                    return RedirectToAction("Index");
                }

                _logger.LogInformation($"✅ Target user found:");
                _logger.LogInformation($"   ID: '{targetUser.Id}'");
                _logger.LogInformation($"   DisplayName: '{targetUser.GetDisplayName()}'");

                var userName = targetUser.GetDisplayName();
                var encodedUserName = Uri.EscapeDataString(userName);

                _logger.LogInformation($"Original userName: '{userName}'");
                _logger.LogInformation($"Encoded userName: '{encodedUserName}'");

                var redirectUrl = Url.Action("Index", new { userId = userId, userName = encodedUserName });
                _logger.LogInformation($"Redirecting to: '{redirectUrl}'");

                _logger.LogInformation($"=== StartChat DEBUG END ===");
                return RedirectToAction("Index", new
                {
                    userId = userId,
                    userName = encodedUserName
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Error in StartChat for userId: '{userId}'");
                return RedirectToAction("Index");
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetMessages(string userId)
        {
            _logger.LogInformation($"=== GetMessages DEBUG START ===");
            _logger.LogInformation($"Received userId: '{userId ?? "null"}'");

            try
            {
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    _logger.LogWarning("Current user is null in GetMessages");
                    return Unauthorized(new { error = "User not authenticated" });
                }

                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogWarning("userId is null or empty in GetMessages");
                    return BadRequest(new { error = "Invalid user ID" });
                }

                _logger.LogInformation($"Current user: {currentUser.GetDisplayName()} (ID: {currentUser.Id})");
                _logger.LogInformation($"Target user ID: {userId}");

                // Query messages với detailed logging
                _logger.LogInformation("Querying messages from database...");
                var messages = await _context.Messages
                    .Include(m => m.Sender)
                    .Where(m => (m.SenderId == currentUser.Id && m.ReceiverId == userId) ||
                               (m.SenderId == userId && m.ReceiverId == currentUser.Id))
                    .OrderBy(m => m.SentAt)
                    .ToListAsync();

                _logger.LogInformation($"Retrieved {messages.Count} messages between users");

                if (messages.Any())
                {
                    _logger.LogInformation("Sample messages:");
                    foreach (var msg in messages.Take(3))
                    {
                        var contentPreview = msg.Content?.Length > 50 ?
                            msg.Content.Substring(0, 50) + "..." :
                            msg.Content ?? "null";
                        _logger.LogInformation($"   Message: From={msg.SenderId}, To={msg.ReceiverId}, Type={msg.MessageType ?? "null"}, Content={contentPreview}");
                    }
                }

                var result = messages.Select(m => new
                {
                    senderId = m.SenderId,
                    senderName = m.Sender?.GetDisplayName() ?? "Unknown User",
                    content = m.Content,
                    messageType = m.MessageType ?? "text",
                    timestamp = m.SentAt,
                    isRead = m.IsRead
                }).ToList();

                _logger.LogInformation($"Returning {result.Count} formatted messages");
                _logger.LogInformation($"=== GetMessages DEBUG END ===");

                return Json(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Error retrieving messages for user {userId}");
                return StatusCode(500, new { error = "Internal server error: " + ex.Message });
            }
        }

        // DEBUG ENDPOINTS - FIXED ALL TYPE ERRORS
        [HttpGet]
        public async Task<IActionResult> DebugUsers()
        {
            try
            {
                var currentUser = await _userManager.GetUserAsync(User);
                var allUsers = await _context.Users
                    .Select(u => new
                    {
                        Id = u.Id,
                        Email = u.Email,
                        DisplayName = u.GetDisplayName(),
                        EmailConfirmed = u.EmailConfirmed,
                        LockoutEnabled = u.LockoutEnabled,
                        IsCurrentUser = currentUser != null && u.Id == currentUser.Id
                    })
                    .ToListAsync();

                _logger.LogInformation($"Debug: Found {allUsers.Count} total users in database");

                return Json(new
                {
                    success = true,
                    totalUsers = allUsers.Count,
                    currentUserId = currentUser?.Id ?? "null",
                    users = allUsers
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in DebugUsers");
                return Json(new { success = false, error = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> DebugUser(string userId)
        {
            try
            {
                _logger.LogInformation($"Debug: Looking for user with ID: '{userId ?? "null"}'");

                if (string.IsNullOrEmpty(userId))
                {
                    return Json(new { success = false, error = "userId is required" });
                }

                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning($"Debug: User not found: '{userId}'");
                    return Json(new { success = false, error = "User not found" });
                }

                var result = new
                {
                    success = true,
                    user = new
                    {
                        Id = user.Id,
                        Email = user.Email,
                        DisplayName = user.GetDisplayName(),
                        UserName = user.UserName,
                        EmailConfirmed = user.EmailConfirmed,
                        PhoneNumber = user.PhoneNumber,
                        LockoutEnabled = user.LockoutEnabled,
                        LockoutEnd = user.LockoutEnd?.ToString() ?? "null",
                        AccessFailedCount = user.AccessFailedCount
                    }
                };

                _logger.LogInformation($"Debug: User found - {user.GetDisplayName()}");
                return Json(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error in DebugUser for userId: '{userId ?? "null"}'");
                return Json(new { success = false, error = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> DebugMessages(string userId)
        {
            try
            {
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Json(new { success = false, error = "Not authenticated" });
                }

                if (string.IsNullOrEmpty(userId))
                {
                    return Json(new { success = false, error = "userId is required" });
                }

                var messages = await _context.Messages
                    .Include(m => m.Sender)
                    .Include(m => m.Receiver)
                    .Where(m => (m.SenderId == currentUser.Id && m.ReceiverId == userId) ||
                               (m.SenderId == userId && m.ReceiverId == currentUser.Id))
                    .OrderByDescending(m => m.SentAt)
                    .Take(20)
                    .ToListAsync();

                var result = messages.Select(m => new
                {
                    Id = m.Id,
                    SenderId = m.SenderId,
                    SenderDisplayName = m.Sender != null ? m.Sender.GetDisplayName() : "Unknown User",
                    ReceiverId = m.ReceiverId,
                    ReceiverDisplayName = m.Receiver != null ? m.Receiver.GetDisplayName() : "Unknown User",
                    Content = m.Content,
                    MessageType = m.MessageType,
                    SentAt = m.SentAt,
                    IsRead = m.IsRead
                }).ToList();

                return Json(new
                {
                    success = true,
                    messageCount = result.Count,
                    messages = result
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error in DebugMessages for userId: '{userId ?? "null"}'");
                return Json(new { success = false, error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> TestAutoSelect([FromBody] TestAutoSelectRequest request)
        {
            try
            {
                _logger.LogInformation($"=== TEST AUTO SELECT ===");
                _logger.LogInformation($"Test userId: '{request?.UserId ?? "null"}'");
                _logger.LogInformation($"Test userName: '{request?.UserName ?? "null"}'");

                if (request == null || string.IsNullOrEmpty(request.UserId))
                {
                    return Json(new { success = false, error = "userId is required" });
                }

                if (string.IsNullOrEmpty(request.UserName))
                {
                    return Json(new { success = false, error = "userName is required" });
                }

                var user = await _userManager.FindByIdAsync(request.UserId);
                if (user == null)
                {
                    _logger.LogWarning($"User not found for testing: '{request.UserId}'");
                    return Json(new { success = false, error = "User not found" });
                }

                var encodedUserName = Uri.EscapeDataString(request.UserName);
                var testUrl = Url.Action("Index", new { userId = request.UserId, userName = encodedUserName });

                _logger.LogInformation($"Generated test URL: {testUrl}");

                return Json(new
                {
                    success = true,
                    message = "Test parameters validated successfully",
                    testUrl = testUrl,
                    originalUserName = request.UserName,
                    encodedUserName = encodedUserName,
                    user = new
                    {
                        Id = user.Id,
                        Email = user.Email,
                        DisplayName = user.GetDisplayName(),
                        UserName = user.UserName
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error in TestAutoSelect");
                return Json(new { success = false, error = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> DebugChatList()
        {
            try
            {
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Json(new { success = false, error = "Not authenticated" });
                }

                // Get the same users that would appear in chat list
                var users = await _context.Users
                    .Where(u => u.Id != currentUser.Id)
                    .Where(u => !string.IsNullOrEmpty(u.Email))
                    .OrderBy(u => u.FullName ?? u.Email)
                    .Select(u => new
                    {
                        Id = u.Id,
                        Email = u.Email,
                        DisplayName = u.GetDisplayName(),
                        UserName = u.UserName,
                        ProfilePicture = u.ProfilePicture,
                        EmailConfirmed = u.EmailConfirmed
                    })
                    .ToListAsync();

                _logger.LogInformation($"Debug: Chat list would contain {users.Count} users");

                return Json(new
                {
                    success = true,
                    currentUserId = currentUser.Id,
                    currentUserDisplayName = currentUser.GetDisplayName(),
                    totalUsers = users.Count,
                    users = users
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in DebugChatList");
                return Json(new { success = false, error = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> DebugAutoSelect(string userId, string userName)
        {
            try
            {
                _logger.LogInformation($"=== DEBUG AUTO SELECT ===");
                _logger.LogInformation($"Input userId: '{userId ?? "null"}'");
                _logger.LogInformation($"Input userName: '{userName ?? "null"}'");

                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    return Json(new { success = false, error = "Not authenticated" });
                }

                var baseResult = new
                {
                    success = true,
                    currentUser = new
                    {
                        Id = currentUser.Id,
                        DisplayName = currentUser.GetDisplayName()
                    },
                    inputParameters = new
                    {
                        userId = userId ?? "null",
                        userName = userName ?? "null",
                        userIdValid = !string.IsNullOrEmpty(userId),
                        userNameValid = !string.IsNullOrEmpty(userName)
                    }
                };

                // Check if target user exists
                if (!string.IsNullOrEmpty(userId))
                {
                    var targetUser = await _userManager.FindByIdAsync(userId);
                    if (targetUser != null)
                    {
                        return Json(new
                        {
                            success = true,
                            currentUser = baseResult.currentUser,
                            inputParameters = baseResult.inputParameters,
                            targetUser = new
                            {
                                Id = targetUser.Id,
                                DisplayName = targetUser.GetDisplayName(),
                                found = true
                            }
                        });
                    }
                    else
                    {
                        return Json(new
                        {
                            success = true,
                            currentUser = baseResult.currentUser,
                            inputParameters = baseResult.inputParameters,
                            targetUser = new
                            {
                                found = false,
                                searchedId = userId
                            }
                        });
                    }
                }

                return Json(baseResult);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error in DebugAutoSelect");
                return Json(new { success = false, error = ex.Message });
            }
        }

        [HttpGet]
        public IActionResult DebugUrlParams()
        {
            try
            {
                var queryParams = new Dictionary<string, string>();
                foreach (var param in Request.Query)
                {
                    queryParams[param.Key] = param.Value.ToString();
                }

                var result = new
                {
                    success = true,
                    url = Request.GetDisplayUrl(),
                    queryString = Request.QueryString.ToString(),
                    parameters = queryParams,
                    headers = new
                    {
                        userAgent = Request.Headers["User-Agent"].ToString(),
                        referer = Request.Headers["Referer"].ToString(),
                        host = Request.Headers["Host"].ToString()
                    }
                };

                _logger.LogInformation($"Debug URL Params: {System.Text.Json.JsonSerializer.Serialize(result)}");

                return Json(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in DebugUrlParams");
                return Json(new { success = false, error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> ForceAutoSelect([FromBody] ForceAutoSelectRequest request)
        {
            try
            {
                _logger.LogInformation($"=== FORCE AUTO SELECT ===");
                _logger.LogInformation($"Force userId: '{request?.UserId ?? "null"}'");
                _logger.LogInformation($"Force userName: '{request?.UserName ?? "null"}'");

                if (request == null || string.IsNullOrEmpty(request.UserId) || string.IsNullOrEmpty(request.UserName))
                {
                    return Json(new { success = false, error = "Both userId and userName are required" });
                }

                // Validate user exists
                var user = await _userManager.FindByIdAsync(request.UserId);
                if (user == null)
                {
                    return Json(new { success = false, error = "User not found" });
                }

                // Generate the redirect URL
                var encodedUserName = Uri.EscapeDataString(request.UserName);
                var redirectUrl = Url.Action("Index", new { userId = request.UserId, userName = encodedUserName });

                _logger.LogInformation($"Force auto-select redirect URL: {redirectUrl}");

                return Json(new
                {
                    success = true,
                    message = "Force auto-select prepared",
                    redirectUrl = redirectUrl,
                    user = new
                    {
                        Id = user.Id,
                        Email = user.Email,
                        DisplayName = user.GetDisplayName()
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error in ForceAutoSelect");
                return Json(new { success = false, error = ex.Message });
            }
        }

        [HttpGet]
        public IActionResult TestEncoding(string input)
        {
            try
            {
                if (string.IsNullOrEmpty(input))
                {
                    return Json(new { success = false, error = "Input is required" });
                }

                var encoded = Uri.EscapeDataString(input);
                var decoded = Uri.UnescapeDataString(encoded);
                var doubleEncoded = Uri.EscapeDataString(encoded);
                var doubleDecoded = Uri.UnescapeDataString(Uri.UnescapeDataString(doubleEncoded));

                return Json(new
                {
                    success = true,
                    original = input,
                    encoded = encoded,
                    decoded = decoded,
                    doubleEncoded = doubleEncoded,
                    doubleDecoded = doubleDecoded,
                    matches = new
                    {
                        encodedDecoded = (input == decoded),
                        doubleEncodedDecoded = (input == doubleDecoded)
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error in TestEncoding for input: '{input ?? "null"}'");
                return Json(new { success = false, error = ex.Message });
            }
        }
    }

    // Request models để fix type errors
    public class TestAutoSelectRequest
    {
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
    }

    public class ForceAutoSelectRequest
    {
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
    }
}