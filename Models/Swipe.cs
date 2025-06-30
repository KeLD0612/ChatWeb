using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace webchat.Models
{
    /// <summary>
    /// Model đại diện cho hành động swipe của user
    /// </summary>
    public class Swipe
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string SwiperId { get; set; } // User thực hiện swipe

        [Required]
        public string SwipedUserId { get; set; } // User bị swipe

        [Required]
        [StringLength(10)]
        public string Action { get; set; } // "like" hoặc "pass"

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public bool IsUndone { get; set; } = false; // Đánh dấu đã bị undo

        public DateTime? UndoneAt { get; set; } // Thời gian undo

        // Navigation properties
        [ForeignKey(nameof(SwiperId))]
        public virtual ApplicationUser Swiper { get; set; }

        [ForeignKey(nameof(SwipedUserId))]
        public virtual ApplicationUser SwipedUser { get; set; }
    }
}
