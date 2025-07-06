using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace webchat.Models
{
    public class UserProfile
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; }

        // Thông tin cơ bản
        [MaxLength(1000)]
        public string Bio { get; set; } = string.Empty;

        public DateTime? DateOfBirth { get; set; }

        [MaxLength(100)]
        public string Location { get; set; } = string.Empty;

        // Thông tin mở rộng cho hẹn hò
        [MaxLength(500)]
        public string Interests { get; set; } = string.Empty; // JSON array of interests

        [MaxLength(20)]
        public string Gender { get; set; } = string.Empty; // Nam, Nữ, Khác

        [MaxLength(100)]
        public string FashionStyle { get; set; } = string.Empty; // Thời trang

        [MaxLength(500)]
        public string Personality { get; set; } = string.Empty; // Tính cách

        [MaxLength(100)]
        public string RelationshipGoal { get; set; } = string.Empty; // Mục tiêu mối quan hệ

        [MaxLength(500)]
        public string IdealPartner { get; set; } = string.Empty; // Mẫu người lý tưởng

        [MaxLength(50)]
        public string Province { get; set; } = string.Empty; // Tỉnh thành

        [MaxLength(50)]
        public string District { get; set; } = string.Empty; // Quận huyện

        // Ảnh profile
        public string ProfilePictureUrl { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string PhotoUrls { get; set; } = string.Empty; // JSON array of photo URLs

        // Thông tin hiển thị
        public bool IsProfileComplete { get; set; } = false;
        public bool IsVisible { get; set; } = true; // Hiển thị trên explore

        // Thông tin thống kê
        public int ViewCount { get; set; } = 0;
        public int LikeCount { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        // Navigation property
        [ForeignKey("UserId")]
        public virtual ApplicationUser User { get; set; }
    }
}