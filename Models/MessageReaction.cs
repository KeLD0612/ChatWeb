namespace webchat.Models
{
    public class MessageReaction
    {
        public int Id { get; set; }
        public int MessageId { get; set; }
        public Message Message { get; set; }
        public string UserId { get; set; }
        public ApplicationUser User { get; set; }
        public string ReactionType { get; set; }
    }
}