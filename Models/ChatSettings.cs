// ChatSettings.cs - Tạo file mới trong thư mục Models
using System.ComponentModel.DataAnnotations;

namespace webchat.Models
{
    public class ChatSettings
    {
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; }

        [Required]
        public string OtherUserId { get; set; }

        // Hình nền cho đoạn chat
        public string BackgroundImage { get; set; } = "default.jpg";

        // Biệt danh cho người kia
        public string Nickname { get; set; }

        // Chủ đề chat
        public string Theme { get; set; } = "default";

        // Thời gian cập nhật
        public DateTime LastUpdated { get; set; } = DateTime.Now;

        // Navigation property
        public virtual ApplicationUser User { get; set; }
    }
}