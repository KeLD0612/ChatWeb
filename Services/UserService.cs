using Microsoft.EntityFrameworkCore;
using webchat.Controllers;
using webchat.Models;

namespace webchat.Services
{
    /// <summary>
    /// Interface cho User Service với các phương thức discovery
    /// </summary>
    public interface IUserService
    {
        // Basic user operations
        Task<ApplicationUser> GetUserByIdAsync(string userId);
        Task<IEnumerable<ApplicationUser>> GetUsersForDiscoveryAsync(string currentUserId, int count = 10, bool resetState = false);

        // Swipe operations
        Task SaveSwipeActionAsync(string swiperId, string swipedUserId, string action);
        Task<bool> CheckMatchAsync(string userId1, string userId2);
        Task CreateMatchAsync(string userId1, string userId2);
        Task<UndoSwipeResult> UndoLastSwipeAsync(string userId);
        Task<bool> CanUndoSwipeAsync(string userId);

        // Stats and matches
        Task<Controllers.SwipeStats> GetSwipeStatsAsync(string userId);
        Task<IEnumerable<Match>> GetMatchesAsync(string userId);

        // Discovery settings
        Task<DiscoverySettings> GetDiscoverySettingsAsync(string userId);
        Task UpdateDiscoverySettingsAsync(string userId, DiscoverySettings settings);

        // Premium features
        Task<bool> CanSuperLikeAsync(string userId);
        Task UseSuperLikeAsync(string senderId, string receiverId);
        Task<bool> CanBoostProfileAsync(string userId);
        Task ActivateProfileBoostAsync(string userId, int durationMinutes = 30);
    }

    /// <summary>
    /// Implementation của User Service
    /// </summary>
    public class UserService : IUserService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<UserService> _logger;
        private readonly IConfiguration _configuration;

        public UserService(
            ApplicationDbContext context, 
            ILogger<UserService> logger,
            IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
        }

        /// <summary>
        /// Lấy thông tin user theo ID
        /// </summary>
        public async Task<ApplicationUser> GetUserByIdAsync(string userId)
        {
            try
            {
                return await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting user by ID: {userId}");
                throw;
            }
        }

        /// <summary>
        /// Lấy danh sách users để khám phá (loại trừ những user đã swipe)
        /// </summary>
        public async Task<IEnumerable<ApplicationUser>> GetUsersForDiscoveryAsync(string currentUserId, int count = 10, bool resetState = false)
        {
            try
            {
                // Lấy cài đặt discovery của user
                var settings = await GetDiscoverySettingsAsync(currentUserId);

                // Lấy danh sách user đã swipe (nếu không reset)
                var swipedUserIds = new List<string>();
                if (!resetState)
                {
                    swipedUserIds = await _context.Swipe
                        .Where(s => s.SwiperId == currentUserId && !s.IsUndone)
                        .Select(s => s.SwipedUserId)
                        .ToListAsync();
                }

                // Query users dựa trên filters
                var query = _context.Users
                    .Where(u => u.Id != currentUserId) // Loại trừ chính mình
                    .Where(u => !swipedUserIds.Contains(u.Id)); // Loại trừ đã swipe

                // Áp dụng age filter
                if (settings != null)
                {
                    var minBirthDate = DateTime.Now.AddYears(-settings.MaxAge);
                    var maxBirthDate = DateTime.Now.AddYears(-settings.MinAge);

                    query = query.Where(u => u.DateOfBirth >= minBirthDate && u.DateOfBirth <= maxBirthDate);

                    // Áp dụng gender filter
                    //if (settings.PreferredGender != "All")
                    //{
                    //    query = query.Where(u => u.Gender == settings.PreferredGender);
                    //}

                    // Áp dụng online filter
                    if (settings.ShowOnlyOnline)
                    {
                        query = query.Where(u => u.IsActive);
                    }

                    // Áp dụng verified filter
                    //if (settings.ShowVerifiedOnly)
                    //{
                    //    query = query.Where(u => u.IsVerified);
                    //}
                }

                // Randomize và lấy số lượng yêu cầu
                var users = await query
                    .OrderBy(u => Guid.NewGuid()) // Random order
                    .Take(count)
                    .ToListAsync();

                _logger.LogInformation($"Found {users.Count} users for discovery for user {currentUserId}");

                return users;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting users for discovery for user {currentUserId}");
                throw;
            }
        }

        /// <summary>
        /// Lưu hành động swipe
        /// </summary>
        public async Task SaveSwipeActionAsync(string swiperId, string swipedUserId, string action)
        {
            try
            {
                var swipe = new Swipe
                {
                    SwiperId = swiperId,
                    SwipedUserId = swipedUserId,
                    Action = action.ToLower(),
                    CreatedAt = DateTime.UtcNow
                };

                _context.Swipe.Add(swipe);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Saved swipe action: {swiperId} {action} {swipedUserId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error saving swipe action: {swiperId} {action} {swipedUserId}");
                throw;
            }
        }

        /// <summary>
        /// Kiểm tra có match không
        /// </summary>
        public async Task<bool> CheckMatchAsync(string userId1, string userId2)
        {
            try
            {
                // Kiểm tra user2 đã like user1 chưa
                var reciprocalLike = await _context.Swipe
                    .AnyAsync(s => s.SwiperId == userId2 && 
                                  s.SwipedUserId == userId1 && 
                                  s.Action == "like" && 
                                  !s.IsUndone);

                _logger.LogInformation($"Checking match between {userId1} and {userId2}: {reciprocalLike}");

                return reciprocalLike;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error checking match between {userId1} and {userId2}");
                throw;
            }
        }

        /// <summary>
        /// Tạo match record
        /// </summary>
        public async Task CreateMatchAsync(string userId1, string userId2)
        {
            try
            {
                // Kiểm tra match đã tồn tại chưa
                var existingMatch = await _context.Matches
                    .AnyAsync(m => m.UserId1 == userId1 && m.UserId2 == userId2 ||
                                  m.UserId1 == userId2 && m.UserId2 == userId1);

                if (!existingMatch)
                {
                    var match = new Match
                    {
                        UserId1 = userId1,
                        UserId2 = userId2,
                        MatchedAt = DateTime.UtcNow,
                        Status = "active"
                    };

                    _context.Matches.Add(match);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation($"Created match between {userId1} and {userId2}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating match between {userId1} and {userId2}");
                throw;
            }
        }

        /// <summary>
        /// Undo hành động swipe cuối cùng
        /// </summary>
        public async Task<UndoSwipeResult> UndoLastSwipeAsync(string userId)
        {
            try
            {
                var lastSwipe = await _context.Swipe
                    .Where(s => s.SwiperId == userId && !s.IsUndone)
                    .OrderByDescending(s => s.CreatedAt)
                    .FirstOrDefaultAsync();

                if (lastSwipe == null)
                {
                    return new UndoSwipeResult 
                    { 
                        Success = false, 
                        ErrorMessage = "Không có hành động nào để hoàn tác" 
                    };
                }

                // Đánh dấu swipe đã bị undo
                lastSwipe.IsUndone = true;
                lastSwipe.UndoneAt = DateTime.UtcNow;

                // Nếu có match, xóa match
                if (lastSwipe.Action == "like")
                {
                    var match = await _context.Matches
                        .FirstOrDefaultAsync(m =>
                            (m.UserId1 == userId && m.UserId2 == lastSwipe.SwipedUserId) ||
                            (m.UserId1 == lastSwipe.SwipedUserId && m.UserId2 == userId));

                    if (match != null)
                    {
                        match.Status = "active";
                        match.UnmatchedAt = DateTime.UtcNow;
                        match.UnmatchedBy = userId;
                    }
                }

                await _context.SaveChangesAsync();

                var undoedUser = await GetUserByIdAsync(lastSwipe.SwipedUserId);

                _logger.LogInformation($"Undid last swipe for user {userId}");

                return new UndoSwipeResult 
                { 
                    Success = true, 
                    UndoedUser = undoedUser 
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error undoing last swipe for user {userId}");
                throw;
            }
        }

        /// <summary>
        /// Kiểm tra có thể undo không
        /// </summary>
        public async Task<bool> CanUndoSwipeAsync(string userId)
        {
            try
            {
                // Kiểm tra user có premium không
                var user = await GetUserByIdAsync(userId);

                // Giả sử có property IsPremium
                // return user?.IsPremium ?? false;

                // Tạm thời return true cho demo
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error checking undo permission for user {userId}");
                return false;
            }
        }

        /// <summary>
        /// Lấy thống kê swipe
        /// </summary>
        public async Task<Controllers.SwipeStats> GetSwipeStatsAsync(string userId)
        {
            try
            {
                var stats = await _context.Swipe
                    .Where(s => s.SwiperId == userId && !s.IsUndone)
                    .GroupBy(s => s.SwiperId)
                    .Select(g => new Controllers.SwipeStats
                    {
                        TotalSwipes = g.Count(),
                        Likes = g.Count(s => s.Action == "like"),
                        Passes = g.Count(s => s.Action == "pass")
                    })
                    .FirstOrDefaultAsync();

                if (stats == null)
                {
                    stats = new Controllers.SwipeStats();
                }

                // Đếm số matches
                stats.Matches = await _context.Matches
                    .CountAsync(m => (m.UserId1 == userId || m.UserId2 == userId) && m.Status == "Active");

                return stats;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting swipe stats for user {userId}");
                throw;
            }
        }

        /// <summary>
        /// Lấy danh sách matches
        /// </summary>
        public async Task<IEnumerable<Match>> GetMatchesAsync(string userId)
        {
            try
            {
                var matches = await _context.Matches
                    .Include(m => m.User1)
                    .Include(m => m.User2)
                    .Where(m => (m.UserId1 == userId || m.UserId2 == userId) && m.Status == "Active")
                    .OrderByDescending(m => m.Status == "Active")
                    .ToListAsync();

                return matches;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting matches for user {userId}");
                throw;
            }
        }

        /// <summary>
        /// Lấy cài đặt discovery
        /// </summary>
        public async Task<DiscoverySettings> GetDiscoverySettingsAsync(string userId)
        {
            try
            {
                var settings = await _context.DiscoverySettings
                    .FirstOrDefaultAsync(s => s.UserId == userId);

                if (settings == null)
                {
                    // Tạo cài đặt mặc định
                    settings = new DiscoverySettings
                    {
                        UserId = userId,
                        MinAge = 18,
                        MaxAge = 99,
                        MaxDistance = 50,
                        //PreferredGender = "All",  
                        // TODO: Add gender preference logic in ApplicationUser model
                        ShowOnlyOnline = false,
                        //ShowVerifiedOnly = false
                    };

                    _context.DiscoverySettings.Add(settings);
                    await _context.SaveChangesAsync();
                }

                return settings;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting discovery settings for user {userId}");
                throw;
            }
        }

        /// <summary>
        /// Cập nhật cài đặt discovery
        /// </summary>
        public async Task UpdateDiscoverySettingsAsync(string userId, DiscoverySettings settings)
        {
            try
            {
                var existingSettings = await _context.DiscoverySettings
                    .FirstOrDefaultAsync(s => s.UserId == userId);

                if (existingSettings != null)
                {
                    existingSettings.MinAge = settings.MinAge;
                    existingSettings.MaxAge = settings.MaxAge;
                    existingSettings.MaxDistance = settings.MaxDistance;
                    //existingSettings.PreferredGender = settings.PreferredGender;
                    existingSettings.ShowOnlyOnline = settings.ShowOnlyOnline;
                    //existingSettings.ShowVerifiedOnly = settings.ShowVerifiedOnly;
                    existingSettings.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    settings.UserId = userId;
                    _context.DiscoverySettings.Add(settings);
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation($"Updated discovery settings for user {userId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating discovery settings for user {userId}");
                throw;
            }
        }

        /// <summary>
        /// Kiểm tra có thể super like không
        /// </summary>
        public async Task<bool> CanSuperLikeAsync(string userId)
        {
            try
            {
                // Kiểm tra số super likes đã dùng hôm nay
                var today = DateTime.Today;
                var superLikesToday = await _context.SuperLikes
                    .CountAsync(sl => sl.SenderId == userId && sl.CreatedAt >= today);

                // Giả sử free user có 1 super like/ngày, premium có 5
                var user = await GetUserByIdAsync(userId);
                var maxSuperLikes = 1; // user?.IsPremium ?? false ? 5 : 1;

                return superLikesToday < maxSuperLikes;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error checking super like permission for user {userId}");
                return false;
            }
        }

        /// <summary>
        /// Sử dụng super like
        /// </summary>
        public async Task UseSuperLikeAsync(string senderId, string receiverId)
        {
            try
            {
                var superLike = new SuperLike
                {
                    SenderId = senderId,
                    ReceiverId = receiverId,
                    CreatedAt = DateTime.UtcNow
                };

                _context.SuperLikes.Add(superLike);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Super like sent from {senderId} to {receiverId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending super like from {senderId} to {receiverId}");
                throw;
            }
        }

        /// <summary>
        /// Kiểm tra có thể boost profile không
        /// </summary>
        public async Task<bool> CanBoostProfileAsync(string userId)
        {
            try
            {
                // Kiểm tra có boost đang active không
                var activeBoost = await _context.ProfileBoosts
                    .AnyAsync(pb => pb.UserId == userId && 
                                   DateTime.UtcNow >= pb.BoostStartTime && 
                                   DateTime.UtcNow <= pb.BoostEndTime);

                return !activeBoost;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error checking boost permission for user {userId}");
                return false;
            }
        }

        /// <summary>
        /// Kích hoạt profile boost
        /// </summary>
        public async Task ActivateProfileBoostAsync(string userId, int durationMinutes = 30)
        {
            try
            {
                var boost = new ProfileBoost
                {
                    UserId = userId,
                    BoostStartTime = DateTime.UtcNow,
                    BoostEndTime = DateTime.UtcNow.AddMinutes(durationMinutes),
                    DurationMinutes = durationMinutes
                };

                _context.ProfileBoosts.Add(boost);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Profile boost activated for user {userId} for {durationMinutes} minutes");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error activating profile boost for user {userId}");
                throw;
            }
        }

        Task<Controllers.SwipeStats> IUserService.GetSwipeStatsAsync(string userId)
        {
            throw new NotImplementedException();
        }
    }
}
