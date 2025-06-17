using System.ComponentModel.DataAnnotations;

namespace webchat.Models
{
    public class Like
    {
        public int LikeId { get; set; }

        [Required]
        public string LikerId { get; set; }

        [Required]
        public string LikedUserId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public string Status { get; set; } = "Like"; // Like, Dislike

        // Navigation properties
        public ApplicationUser Liker { get; set; }
        public ApplicationUser LikedUser { get; set; }
    }
}
