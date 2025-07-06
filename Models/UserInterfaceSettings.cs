// UserInterfaceSettings.cs - Tạo file mới trong thư mục Models
using System.ComponentModel.DataAnnotations;

namespace webchat.Models
{
    public class UserInterfaceSettings
    {
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; }

        // Hình nền
        public string BackgroundImage { get; set; } = "default.jpg";

        // Màu chủ đạo
        public string PrimaryColor { get; set; } = "#0d6efd";

        // Theme (light/dark)
        public string Theme { get; set; } = "light";

        // Font chữ
        public string FontFamily { get; set; } = "default";

        // Thiết lập bố cục
        public string ChatLayout { get; set; } = "standard";

        // Thời gian cập nhật
        public DateTime LastUpdated { get; set; } = DateTime.Now;

        // Navigation property
        public virtual ApplicationUser User { get; set; }
    }
}