using System.ComponentModel.DataAnnotations;

namespace webchat.Models.ViewModels
{
    public class CompleteRegistrationViewModel
    {
        // Step 1: Thông tin cơ bản
        [Required(ErrorMessage = "Tên không được để trống")]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        // ✅ FIX: Email không required nếu là external login
        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        public string Email { get; set; } = string.Empty;

        // ✅ FIX: Password không required nếu là external login
        [MinLength(6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự")]
        public string Password { get; set; } = string.Empty;

        // Step 2: Giới tính
        [Required(ErrorMessage = "Vui lòng chọn giới tính")]
        public string Gender { get; set; } = string.Empty;

        // Step 3: Ngày sinh
        [Required(ErrorMessage = "Ngày sinh không được để trống")]
        [Range(1, 31, ErrorMessage = "Ngày không hợp lệ")]
        public int BirthDay { get; set; }

        [Required(ErrorMessage = "Tháng sinh không được để trống")]
        [Range(1, 12, ErrorMessage = "Tháng không hợp lệ")]
        public int BirthMonth { get; set; }

        [Required(ErrorMessage = "Năm sinh không được để trống")]
        [Range(1940, 2006, ErrorMessage = "Năm sinh không hợp lệ")]
        public int BirthYear { get; set; }

        // Step 4: Địa điểm
        [Required(ErrorMessage = "Vui lòng chọn tỉnh thành")]
        public string Province { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng chọn quận huyện")]
        public string District { get; set; } = string.Empty;

        // Step 5: Sở thích
        public List<string> Interests { get; set; } = new List<string>();
        public string CustomInterest { get; set; } = string.Empty;

        // Step 6: Thời trang
        public string FashionStyle { get; set; } = string.Empty;
        public string CustomFashionStyle { get; set; } = string.Empty;

        // Step 7: Tính cách
        public List<string> PersonalityTraits { get; set; } = new List<string>();
        public string CustomPersonality { get; set; } = string.Empty;

        // Step 8: Mục tiêu mối quan hệ
        public string RelationshipGoal { get; set; } = string.Empty;
        public string CustomRelationshipGoal { get; set; } = string.Empty;

        // Step 9: Mẫu người lý tưởng
        public string IdealPartner { get; set; } = string.Empty;

        // Step 10: Bio
        [MaxLength(500, ErrorMessage = "Bio không được quá 500 ký tự")]
        public string Bio { get; set; } = string.Empty;

        // Step 11: Ảnh
        public IFormFile? ProfilePicture { get; set; }
        public List<IFormFile> AdditionalPhotos { get; set; } = new List<IFormFile>();

        // ✅ FIX: Thêm properties cho external login
        public bool IsExternalLogin { get; set; } = false;
        public string ExternalLoginProvider { get; set; } = string.Empty;

        // ✅ FIX: Custom validation method
        public bool IsValid(out List<string> errors)
        {
            errors = new List<string>();

            // Validate FullName (always required)
            if (string.IsNullOrEmpty(FullName?.Trim()))
            {
                errors.Add("Tên không được để trống");
            }

            // Validate Email và Password chỉ cho regular registration
            if (!IsExternalLogin)
            {
                if (string.IsNullOrEmpty(Email?.Trim()))
                {
                    errors.Add("Email không được để trống");
                }
                else if (!IsValidEmail(Email))
                {
                    errors.Add("Email không hợp lệ");
                }

                if (string.IsNullOrEmpty(Password) || Password.Length < 6)
                {
                    errors.Add("Mật khẩu phải có ít nhất 6 ký tự");
                }
            }

            // Validate other required fields
            if (string.IsNullOrEmpty(Gender?.Trim()))
            {
                errors.Add("Vui lòng chọn giới tính");
            }

            if (BirthDay <= 0 || BirthMonth <= 0 || BirthYear <= 0)
            {
                errors.Add("Vui lòng nhập ngày sinh hợp lệ");
            }

            if (string.IsNullOrEmpty(Province?.Trim()))
            {
                errors.Add("Vui lòng chọn tỉnh thành");
            }

            if (string.IsNullOrEmpty(District?.Trim()))
            {
                errors.Add("Vui lòng chọn quận huyện");
            }

            // Validate age (18+)
            try
            {
                var birthDate = new DateTime(BirthYear, BirthMonth, BirthDay);
                var age = DateTime.Now.Year - birthDate.Year;
                if (DateTime.Now < birthDate.AddYears(age)) age--;

                if (age < 18)
                {
                    errors.Add("Bạn phải từ 18 tuổi trở lên");
                }
            }
            catch
            {
                errors.Add("Ngày sinh không hợp lệ");
            }

            return errors.Count == 0;
        }

        private bool IsValidEmail(string email)
        {
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }

        // Computed property
        public DateTime DateOfBirth
        {
            get
            {
                try
                {
                    return new DateTime(BirthYear, BirthMonth, BirthDay);
                }
                catch
                {
                    return DateTime.MinValue;
                }
            }
        }
    }

    // Helper classes cho dropdowns và data
    public static class RegistrationData
    {
        public static readonly List<string> Provinces = new List<string>
        {
            "Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ",
            "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu",
            "Bắc Ninh", "Bến Tre", "Bình Định", "Bình Dương", "Bình Phước",
            "Bình Thuận", "Cà Mau", "Cao Bằng", "Đắk Lắk", "Đắk Nông",
            "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Giang",
            "Hà Nam", "Hà Tĩnh", "Hải Dương", "Hậu Giang", "Hòa Bình",
            "Hưng Yên", "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu",
            "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Long An", "Nam Định",
            "Nghệ An", "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên",
            "Quảng Bình", "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị",
            "Sóc Trăng", "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên",
            "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang", "Trà Vinh", "Tuyên Quang",
            "Vĩnh Long", "Vĩnh Phúc", "Yên Bái"
        };

        // Districts data for major cities
        public static readonly Dictionary<string, List<string>> Districts = new Dictionary<string, List<string>>
        {
            ["Hà Nội"] = new List<string>
            {
                "Ba Đình", "Hoàn Kiếm", "Tây Hồ", "Long Biên", "Cầu Giấy", "Đống Đa",
                "Hai Bà Trưng", "Hoàng Mai", "Thanh Xuân", "Sóc Sơn", "Đông Anh",
                "Gia Lâm", "Nam Từ Liêm", "Bắc Từ Liêm", "Mê Linh", "Hà Đông",
                "Sơn Tây", "Ba Vì", "Phúc Thọ", "Đan Phượng", "Hoài Đức",
                "Quốc Oai", "Thạch Thất", "Chương Mỹ", "Thanh Oai", "Thường Tín",
                "Phú Xuyên", "Ứng Hòa", "Mỹ Đức"
            },
            ["TP. Hồ Chí Minh"] = new List<string>
            {
                "Quận 1", "Quận 2", "Quận 3", "Quận 4", "Quận 5", "Quận 6",
                "Quận 7", "Quận 8", "Quận 9", "Quận 10", "Quận 11", "Quận 12",
                "Thủ Đức", "Gò Vấp", "Bình Thạnh", "Tân Bình", "Tân Phú",
                "Phú Nhuận", "Bình Tân", "Hóc Môn", "Củ Chi", "Bình Chánh",
                "Nhà Bè", "Cần Giờ"
            },
            ["Đà Nẵng"] = new List<string>
            {
                "Liên Chiểu", "Thanh Khê", "Hải Châu", "Sơn Trà", "Ngũ Hành Sơn",
                "Cẩm Lệ", "Hòa Vang", "Hoàng Sa"
            }
        };

        public static readonly List<string> CommonInterests = new List<string>
        {
            "Du lịch", "Ẩm thực", "Âm nhạc", "Phim ảnh", "Đọc sách", "Thể thao",
            "Yoga", "Gym", "Chạy bộ", "Bơi lội", "Leo núi", "Chụp ảnh",
            "Vẽ", "Nấu ăn", "Làm bánh", "Game", "Công nghệ", "Lập trình",
            "Thiền", "Múa", "Hát karaoke", "Shopping", "Thời trang", "Làm đẹp",
            "Cà phê", "Trà", "Bar/Pub", "Câu cá", "Làm vườn", "Thú cưng",
            "Xe máy", "Ôtô", "Crypto", "Đầu tư", "Kinh doanh", "Startup"
        };

        public static readonly List<string> FashionStyles = new List<string>
        {
            "Casual - Thoải mái", "Formal - Lịch sự", "Sporty - Thể thao",
            "Vintage - Cổ điển", "Bohemian - Tự do", "Minimalist - Tối giản",
            "Streetwear - Đường phố", "Elegant - Thanh lịch", "Trendy - Hợp thời trang",
            "Korean Style - Phong cách Hàn", "Japanese Style - Phong cách Nhật",
            "Sexy - Gợi cảm", "Sweet - Ngọt ngào", "Rock - Cá tính"
        };

        public static readonly List<string> PersonalityTraits = new List<string>
        {
            "Hòa đồng", "Hài hước", "Lãng mạn", "Thông minh", "Chăm chỉ",
            "Tự tin", "Kiên nhẫn", "Tử tế", "Sáng tạo", "Trung thực",
            "Độc lập", "Phiêu lưu", "Yên tĩnh", "Năng động", "Ôn hòa",
            "Quyết đoán", "Chu đáo", "Lạc quan", "Thực tế", "Mơ mộng",
            "Quan tâm", "Dịu dàng", "Mạnh mẽ", "Nhạy cảm", "Cởi mở"
        };

        public static readonly List<string> RelationshipGoals = new List<string>
        {
            "Tìm hiểu - Làm quen", "Hẹn hò nghiêm túc", "Kết hôn",
            "Tìm bạn đời", "Tình yêu lâu dài", "Có con cái trong tương lai",
            "Chưa rõ - Tùy duyên", "Chỉ kết bạn", "Tình yêu ngắn hạn",
            "Tìm người đồng hành"
        };
    }
}