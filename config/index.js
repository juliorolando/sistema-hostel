require('dotenv').config();

exports.config = {
    db: {
        user: process.env.DB_USER || '',
        host: process.env.DB_HOST || 'localhost',
        password: process.env.DB_PASSWORD || '',
        port: process.env.DB_PORT || '3306',
        database: process.env.DB_NAME || ''
    }
}
