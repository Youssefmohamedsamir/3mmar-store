using AmarStore.Api.Models;

namespace AmarStore.Api.Services;

public interface ITokenService
{
    string CreateToken(User user);
}
