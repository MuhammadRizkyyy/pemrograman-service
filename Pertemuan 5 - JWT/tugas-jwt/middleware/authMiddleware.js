const jwt = require('jsonwebtoken');
const { secret } = require('../config/jwt');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            message: 'Token tidak ditemukan!'
        });
    }

    jwt.verify(token, secret, (err, user) => {
        if (err) {
            return res.status(403).json({
                message: 'Token tidak valid atau sudah kedaluwarsa!'
            });
        }
        req.user = user;
        next();
    });
};

module.exports = authenticateToken;
