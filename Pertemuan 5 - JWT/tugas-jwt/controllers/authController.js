const jwt = require('jsonwebtoken');
const { findUser } = require('../models/userModel');
const { secret, options } = require('../config/jwt');

exports.login = (req, res) => {
    const { username, password } = req.body;
    const user = findUser(username, password);

    if (user) {
        const token = jwt.sign({ username: user.username }, secret, options);
        return res.json({
            message: 'Login berhasil!',
            token: token
        });
    }

    return res.status(401).json({
        message: 'Username atau password salah!'
    });
};

exports.protected = (req, res) => {
    res.json({
        message: 'Anda berhasil mengakses endpoint terproteksi!',
        user: req.user
    });
};
