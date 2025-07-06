using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using webchat.Models;

namespace DatingApp.Models
{
    public class Notification
    {
        [Key]
        public int NotificationId { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [ForeignKey("UserId")]
        public ApplicationUser User { get; set; } = null!;

        public string? FromUserId { get; set; }

        [ForeignKey("FromUserId")]
        public ApplicationUser? FromUser { get; set; }

        [Required]
        public NotificationType Type { get; set; }

        [Required]
        [MaxLength(500)]
        public string Content { get; set; } = string.Empty;

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public int? MessageId { get; set; }

        // Helper methods để lấy icon và class CSS
        public string GetTypeIcon()
        {
            return Type switch
            {
                NotificationType.Message => "fas fa-envelope",
                NotificationType.Like => "fas fa-heart",
                NotificationType.Match => "fas fa-fire",
                NotificationType.Comment => "fas fa-comment-dots",
                NotificationType.Follow => "fas fa-user-plus",
                NotificationType.System => "fas fa-cog",
                NotificationType.Warning => "fas fa-exclamation-triangle",
                NotificationType.Ban => "fas fa-ban",
                _ => "fas fa-bell"
            };
        }

        public string GetTypeCssClass()
        {
            return Type switch
            {
                NotificationType.Message => "type-message",
                NotificationType.Like => "type-like",
                NotificationType.Match => "type-match",
                NotificationType.Comment => "type-comment",
                NotificationType.Follow => "type-follow",
                NotificationType.System => "type-system",
                NotificationType.Warning => "type-warning",
                NotificationType.Ban => "type-ban",
                _ => "type-default"
            };
        }
    }

    // Enum cho loại thông báo
    public enum NotificationType
    {
        Message = 1,
        Like = 2,
        Match = 3,
        Comment = 4,
        Follow = 5,
        System = 6,
        Warning = 7,
        Ban = 8
    }

    // Helper class để convert giữa enum và string
    public static class NotificationTypeHelper
    {
        public static string ToString(NotificationType type)
        {
            return type switch
            {
                NotificationType.Message => "message",
                NotificationType.Like => "like",
                NotificationType.Match => "match",
                NotificationType.Comment => "comment",
                NotificationType.Follow => "follow",
                NotificationType.System => "system",
                NotificationType.Warning => "warning",
                NotificationType.Ban => "ban",
                _ => "unknown"
            };
        }

        public static NotificationType FromString(string type)
        {
            return type?.ToLower() switch
            {
                "message" => NotificationType.Message,
                "like" => NotificationType.Like,
                "match" => NotificationType.Match,
                "comment" => NotificationType.Comment,
                "follow" => NotificationType.Follow,
                "system" => NotificationType.System,
                "warning" => NotificationType.Warning,
                "ban" => NotificationType.Ban,
                _ => NotificationType.System
            };
        }
    }

    // DTO class để truyền data giữa controller và view
    public class NotificationDto
    {
        public int Id { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? FromUserId { get; set; }
        public string FromUserName { get; set; } = string.Empty;
        public string FromUserAvatar { get; set; } = string.Empty;
        public string TimeAgo { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public string CssClass { get; set; } = string.Empty;
    }
}