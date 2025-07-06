using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace webchat.Models
{
    public class UserInteraction
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        public string TargetUserId { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string InteractionType { get; set; } = string.Empty; // "like", "reject", "super-like", "message"

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // Navigation properties
        [ForeignKey("UserId")]
        public virtual ApplicationUser? User { get; set; }

        [ForeignKey("TargetUserId")]
        public virtual ApplicationUser? TargetUser { get; set; }
    }
}