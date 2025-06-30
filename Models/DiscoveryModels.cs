using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using webchat.Models;

namespace webchat.Models
{
    public class DiscoveryViewModel
    {
        public IEnumerable<UserCardViewModel> Users { get; set; } = new List<UserCardViewModel>();
        public SwipeStats Stats { get; set; } = new SwipeStats();
        public ApplicationUser CurrentUser { get; set; }
        public bool HasMoreUsers { get; set; }
        public int TotalAvailableUsers { get; set; }
    }

    /// <summary>
    /// Model cho hiển thị thông tin user trong card
    /// </summary>
    

    /// <summary>
    /// Model cho thống kê swipe
    /// </summary>
    public class SwipeStats
    {
        public int TotalSwipes { get; set; }
        public int Likes { get; set; }
        public int Passes { get; set; }
        public int Matches { get; set; }
        public int TotalViews { get; set; }
        public double LikeRate => TotalSwipes > 0 ? (double)Likes / TotalSwipes * 100 : 0;
        public double MatchRate => Likes > 0 ? (double)Matches / Likes * 100 : 0;
    }

    /// <summary>
    /// Model cho match với thông tin user
    /// </summary>
    public class MatchViewModel
    {
        public int Id { get; set; }
        public UserCardViewModel MatchedUser { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsNewMatch { get; set; }
        public bool HasUnreadMessages { get; set; }
        public string LastMessage { get; set; }
        public DateTime? LastMessageTime { get; set; }
    }

    /// <summary>
    /// Model cho super like (premium feature)
    /// </summary>
    public class SuperLike
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string SenderId { get; set; }

        [Required]
        public string ReceiverId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public bool IsViewed { get; set; } = false;
        public DateTime? ViewedAt { get; set; }

        public bool IsMatched { get; set; } = false;
        public DateTime? MatchedAt { get; set; }

        // Navigation properties
        [ForeignKey(nameof(SenderId))]
        public virtual ApplicationUser Sender { get; set; }

        [ForeignKey(nameof(ReceiverId))]
        public virtual ApplicationUser Receiver { get; set; }
    }

    /// <summary>
    /// Model cho boost profile (premium feature)
    /// </summary>
    public class ProfileBoost
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; }

        public DateTime BoostStartTime { get; set; }
        public DateTime BoostEndTime { get; set; }
        public int DurationMinutes { get; set; } = 30;

        public bool IsActive => DateTime.UtcNow >= BoostStartTime && DateTime.UtcNow <= BoostEndTime;

        public int ViewsGenerated { get; set; } = 0;
        public int LikesGenerated { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        [ForeignKey(nameof(UserId))]
        public virtual ApplicationUser User { get; set; }
    }

    /// <summary>
    /// Model cho lưu trữ filter preferences
    /// </summary>
    public class DiscoveryFilter
    {
        public int MinAge { get; set; } = 18;
        public int MaxAge { get; set; } = 99;
        public int MaxDistance { get; set; } = 50;
        public string PreferredGender { get; set; } = "All";
        public bool ShowOnlyOnline { get; set; } = false;
        public bool ShowVerifiedOnly { get; set; } = false;
        public List<string> RequiredInterests { get; set; } = new List<string>();
        public string Education { get; set; }
        public string JobType { get; set; }
    }

    /// <summary>
    /// Model cho response API
    /// </summary>
    public class DiscoveryApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public T Data { get; set; }
        public int TotalCount { get; set; }
        public bool HasMore { get; set; }
    }

    /// <summary>
    /// Model cho swipe request
    /// </summary>
    public class SwipeRequest
    {
        [Required]
        public string UserId { get; set; }

        [Required]
        [RegularExpression("^(like|pass|superlike)$")]
        public string Action { get; set; }

        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
    }

    /// <summary>
    /// Model cho swipe response
    /// </summary>
    public class SwipeResponse
    {
        public bool Success { get; set; }
        public bool IsMatch { get; set; }
        public UserCardViewModel MatchedUser { get; set; }
        public bool IsSuperLike { get; set; }
        public string Message { get; set; }
        public SwipeStats UpdatedStats { get; set; }
    }

    /// <summary>
    /// Extensions cho models
    /// </summary>
    public static class DiscoveryExtensions
    {
        public static UserCardViewModel ToCardViewModel(this ApplicationUser user)
        {
            return new UserCardViewModel(user);
        }

        public static MatchViewModel ToMatchViewModel(this Match match, string currentUserId)
        {
            var matchedUser = match.UserId1 == currentUserId ? match.User2 : match.User1;

            return new MatchViewModel
            {
                Id = match.MatchId,
                MatchedUser = matchedUser.ToCardViewModel(),
                CreatedAt = match.MatchedAt,
                IsNewMatch = (DateTime.UtcNow - match.MatchedAt).TotalHours < 24
            };
        }
    }
}
