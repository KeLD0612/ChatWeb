using Microsoft.AspNetCore.Identity;
using webchat.Models;

namespace webchat.Data
{
    public static class SeedData
    {
        public static async Task Initialize(IServiceProvider serviceProvider)
        {
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();

            // Tạo roles
            string[] roleNames = { "Admin", "User" };
            foreach (var roleName in roleNames)
            {
                var roleExist = await roleManager.RoleExistsAsync(roleName);
                if (!roleExist)
                {
                    await roleManager.CreateAsync(new IdentityRole(roleName));
                }
            }

            // FIX: Tạo admin user với UserName = Email
            var adminEmail = "admin@dating.com";
            var adminUser = await userManager.FindByEmailAsync(adminEmail);

            if (adminUser == null)
            {
                adminUser = new ApplicationUser
                {
                    UserName = adminEmail, // FIX: UserName phải = Email
                    Email = adminEmail,
                    FullName = "Administrator",
                    EmailConfirmed = true,
                    IsActive = true
                };

                var createAdmin = await userManager.CreateAsync(adminUser, "Admin@123");
                if (createAdmin.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, "Admin");
                }
            }

            // FIX: Tạo test user
            var testEmail = "user@dating.com";
            var testUser = await userManager.FindByEmailAsync(testEmail);

            if (testUser == null)
            {
                testUser = new ApplicationUser
                {
                    UserName = testEmail, // FIX: UserName phải = Email
                    Email = testEmail,
                    FullName = "Test User",
                    EmailConfirmed = true,
                    IsActive = true
                };

                var createUser = await userManager.CreateAsync(testUser, "User@123");
                if (createUser.Succeeded)
                {
                    await userManager.AddToRoleAsync(testUser, "User");
                }
            }
        }
    }
}
