using AmarStore.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AmarStore.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Offer> Offers => Set<Offer>();
    public DbSet<StoreSetting> StoreSettings => Set<StoreSetting>();
    public DbSet<VisitorLog> VisitorLogs => Set<VisitorLog>();
    public DbSet<OrderIntent> OrderIntents => Set<OrderIntent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<StoreSetting>()
            .HasIndex(s => s.Key)
            .IsUnique();

        modelBuilder.Entity<Product>()
            .Property(p => p.Price)
            .HasColumnType("decimal(18,2)");

        modelBuilder.Entity<Product>()
            .Property(p => p.OldPrice)
            .HasColumnType("decimal(18,2)");
    }
}
