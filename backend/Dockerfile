# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src

COPY ["backend/AmarStore.Api.csproj", "backend/"]
RUN dotnet restore "backend/AmarStore.Api.csproj"

COPY backend/ backend/
WORKDIR "/src/backend"
RUN dotnet build "AmarStore.Api.csproj" -c Release -o /app/build
RUN dotnet publish "AmarStore.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000

ENTRYPOINT ["dotnet", "AmarStore.Api.dll"]
