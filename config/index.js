require('dotenv').config();

exports.config = {
    db: {
        user: process.env.DB_USER || 'root',
        host: process.env.DB_HOST || 'localhost',
        password: process.env.DB_PASSWORD || 'jarolando',
        port: process.env.DB_PORT || '3306',
        database: process.env.DB_NAME || 'hamerica'
    }
}