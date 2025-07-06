namespace webchat.Models
{ 
    public class UserBan { 
        public int Id { get; set; } 
        public string UserId { get; set; } 
        public ApplicationUser User { get; set; } 
        public string Reason { get; set; } 
        public DateTime BanStart { get; set; } 
        public DateTime BanEnd { get; set; } 
        public string Status { get; set; } } 
}