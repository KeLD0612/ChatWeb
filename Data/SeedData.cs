// Data/SeedData.cs
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
            var logger = serviceProvider.GetRequiredService<ILogger<Program>>();

            try
            {
                // Tạo roles
                string[] roleNames = { "Admin", "User", "Moderator" };
                foreach (var roleName in roleNames)
                {
                    var roleExist = await roleManager.RoleExistsAsync(roleName);
                    if (!roleExist)
                    {
                        await roleManager.CreateAsync(new IdentityRole(roleName));
                        logger.LogInformation($"✅ Created role: {roleName}");
                    }
                }

                // ✅ FIX: Force reset admin user
                var adminEmail = "admin@dating.com";
                var existingAdmin = await userManager.FindByEmailAsync(adminEmail);

                if (existingAdmin != null)
                {
                    await userManager.DeleteAsync(existingAdmin);
                    logger.LogInformation("🗑️ Deleted existing admin user");
                }

                // Tạo lại admin user mới
                var newAdmin = new ApplicationUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    FullName = "System Administrator",
                    EmailConfirmed = true,
                    IsActive = true,
                    CreatedAt = DateTime.Now
                };

                var createResult = await userManager.CreateAsync(newAdmin, "Admin@123");
                if (createResult.Succeeded)
                {
                    await userManager.AddToRoleAsync(newAdmin, "Admin");
                    logger.LogInformation("✅ FORCE CREATED new admin user");
                }

                // Tạo test user
                var testEmail = "doan@gmail.com";
                var existingUser = await userManager.FindByEmailAsync(testEmail);

                if (existingUser == null)
                {
                    var testUser = new ApplicationUser
                    {
                        UserName = testEmail,
                        Email = testEmail,
                        FullName = "Test User",
                        EmailConfirmed = true,
                        IsActive = true,
                        CreatedAt = DateTime.Now
                    };

                    var createUserResult = await userManager.CreateAsync(testUser, "doan@gmail.com");
                    if (createUserResult.Succeeded)
                    {
                        await userManager.AddToRoleAsync(testUser, "User");
                        logger.LogInformation("✅ Created test user");
                    }
                }

                logger.LogInformation("🎯 SeedData initialization completed successfully");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "❌ Error during SeedData initialization");
                throw;
            }
        }
    }
}
