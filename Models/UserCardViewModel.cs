namespace webchat.Models
{
    public class UserCardViewModel
    {
        public string Id { get; set; }
        public string? FullName { get; set; }
        public DateTime DateOfBirth { get; set; }
        public string? Bio { get; set; }
        public string? ProfilePicture { get; set; }
        public int Age { get; set; }
        public bool IsOnline { get; set; } = true;
        public DateTime? LastActive { get; set; }
        // Constructor ánh xạ từ ApplicationUser
        public UserCardViewModel(ApplicationUser user)
        {
            Id = user.Id;
            FullName = user.FullName;
            DateOfBirth = user.DateOfBirth;
            Bio = user.Bio;
            ProfilePicture = user.ProfilePicture ?? "/images/default-avatar.png"; // Đặt ảnh đại diện mặc định nếu không có
            Age = CalculateAge(user.DateOfBirth);
            IsOnline = user.IsActive;
            LastActive = user.LastActive;
        }

        private int CalculateAge(DateTime dob)
        {
            var today = DateTime.Today;
            var age = today.Year - dob.Year;
            if (dob.Date > today.AddYears(-age)) age--;
            return age;
        }
    }
}
