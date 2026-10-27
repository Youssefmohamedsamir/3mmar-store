using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AmarStore.Api.Models;
using Microsoft.IdentityModel.Tokens;

namespace AmarStore.Api.Services;

public class TokenService : ITokenService
{
    private readonly IConfiguration _config;

    public TokenService(IConfiguration config)
    {
        _config = config;
    }

    public string CreateToken(User user)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Role, user.Role),
            new("provider", user.Provider)
        };

        var secret = _config["Jwt:Key"] ?? "3mmarStore_Ultra_Secure_Secret_Key_2026_Modern_Clean_Code_Long_Enough_Key!";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(7),
            Issuer = _config["Jwt:Issuer"] ?? "3mmarStore",
            Audience = _config["Jwt:Audience"] ?? "3mmarStoreClients",
            SigningCredentials = creds
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }
}
