// Models/MessageReaction.cs
namespace webchat.Models
{
    public class MessageReaction
    {
        public int Id { get; set; }
        public int MessageId { get; set; }
        public string UserId { get; set; }
        public string ReactionType { get; set; } // like, love, haha, wow, sad, angry
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // Navigation properties
        public virtual Message Message { get; set; }
        public virtual ApplicationUser User { get; set; }
    }
}