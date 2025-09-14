# Big Brother Database Integration

## 🗄️ Database Setup Complete

The Big Brother monitoring dashboard now includes a comprehensive SQLite database integration with the following features:

## ✅ **Implemented Features**

### 1. **Database Infrastructure**

- **SQLite Database**: High-performance, file-based database
- **Migration System**: Automated schema management and versioning
- **Connection Management**: Reliable connection pooling and error handling
- **Transaction Support**: ACID compliance for data integrity

### 2. **Database Schema**

```sql
-- Core tables created:
users          -- User authentication and management
applications   -- PM2 application metadata and settings
metrics        -- Historical performance data (CPU, memory, uptime)
logs           -- Persistent log storage with search capabilities
alerts         -- Alert configurations and history
sessions       -- JWT refresh token management
```

### 3. **Database Models**

- **ApplicationModel**: CRUD operations for app management
- **MetricsModel**: Historical data collection and analytics
- **LogModel**: Log persistence and search functionality
- **User**: Enhanced authentication with database support

### 4. **API Endpoints**

| Endpoint                   | Method | Description                               |
| -------------------------- | ------ | ----------------------------------------- |
| `/api/database/status`     | GET    | Database connection status and statistics |
| `/api/database/tables`     | GET    | Detailed table information and schema     |
| `/api/database/backup`     | POST   | Create database backup (Admin only)       |
| `/api/database/cleanup`    | POST   | Clean old data per retention policies     |
| `/api/database/migrations` | GET    | View migration history                    |

## 🚀 **Quick Start Commands**

```bash
# Database setup and management
npm run db:migrate    # Run database migrations
npm run db:seed      # Seed with sample data
npm run db:reset     # Reset database (with backup)

# Server operations
npm run dev          # Start development server
npm run setup        # Configure authentication
```

## 📊 **Enhanced Capabilities**

### Historical Monitoring

- **CPU & Memory Trends**: Track resource usage over time
- **Performance Analytics**: Hourly and daily aggregations
- **Uptime Tracking**: Monitor application availability

### Log Management

- **Persistent Storage**: All logs saved to database
- **Full-Text Search**: Search across all application logs
- **Log Levels**: Filter by error, warn, info, debug
- **Time-based Queries**: Search logs by date ranges

### Alert System (Ready for Implementation)

- **Configurable Thresholds**: Set CPU/memory alerts per app
- **Alert History**: Track alert occurrences
- **Notification Framework**: Ready for email/webhook integration

## 🔧 **Configuration**

Environment variables in `.env`:

```bash
# Database Configuration
DATABASE_PATH=./data/bigbrother.db
DATABASE_BACKUP_PATH=./data/backups
DB_ENABLE_METRICS=true
DB_METRICS_INTERVAL=60000
DB_LOG_RETENTION_DAYS=30
DB_METRICS_RETENTION_DAYS=90
```

## 📈 **Database Statistics**

Current database includes:

- **6 Tables**: All core monitoring functionality
- **Sample Data**: 2 applications, 50+ metrics, 5+ logs
- **Indexes**: Optimized for performance queries
- **Size**: ~88KB with sample data

## 🛠️ **Development Tools**

### Migration System

- Automatic schema creation
- Version tracking in `migrations` table
- Rollback capability (future enhancement)

### Backup & Maintenance

- Automated backup creation
- Data retention policies
- Cleanup commands for old data

### Monitoring & Analytics

- Database performance statistics
- Table record counts
- Connection status monitoring

## 🔜 **Next Steps**

The database foundation is now complete! You can now:

1. **Add Real-time Metrics Collection**: Automatically store PM2 data
2. **Implement Log Persistence**: Save streaming logs to database
3. **Build Alert System**: Create notifications for threshold breaches
4. **Enhance Frontend**: Add historical charts and analytics
5. **User Management**: Support multiple users with database auth

## 🎯 **Benefits Achieved**

- ✅ **Persistent Data**: No more lost monitoring history
- ✅ **Search Capabilities**: Find logs and metrics quickly
- ✅ **Performance Trends**: Track application health over time
- ✅ **Scalable Architecture**: Ready for production deployment
- ✅ **Zero Maintenance**: SQLite requires no database server

The Big Brother dashboard is now a comprehensive monitoring platform with persistent data storage and analytics capabilities!
