# Security Guidelines

## 🚨 Important Security Notice

**NEVER use default credentials in production!**

## First Time Setup

### 1. Set Up Admin Credentials

Before starting the application, you MUST configure admin credentials:

```bash
# In the backend directory
SETUP_PASSWORD=YourSecurePassword123! npm run setup
```

This will:

- Generate a secure password hash
- Create a proper .env file
- Set up JWT secrets

### 2. Environment Variables

Create a `.env` file in the backend directory with:

```env
# NEVER use default values in production
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD_HASH=generated_hash_from_setup

# Generate secure JWT secrets
JWT_SECRET=your_secure_jwt_secret_here
JWT_ACCESS_EXPIRY=30m
JWT_REFRESH_EXPIRY=7d
```

### 3. Production Deployment

For production deployments:

1. **Use strong passwords** (12+ characters, mixed case, numbers, symbols)
2. **Generate unique JWT secrets** for each environment
3. **Never commit .env files** to version control
4. **Regularly rotate secrets** and passwords
5. **Use environment-specific configurations**

## Security Features

- ✅ JWT-based authentication
- ✅ Bcrypt password hashing
- ✅ Environment-based configuration
- ✅ No hardcoded credentials in code
- ✅ Secure session management

## Common Mistakes to Avoid

❌ Using default passwords like "admin123"
❌ Committing .env files to git
❌ Hardcoding credentials in scripts
❌ Using the same secrets across environments
❌ Displaying credentials in UI

## Support

If you see "SETUP_REQUIRED" in any configuration, it means you need to run the setup script first.

For help with setup: `npm run setup --help`
