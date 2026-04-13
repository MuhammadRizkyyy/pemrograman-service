const users = [
    {
        username: 'admin',
        password: 'password123'
    }
];

module.exports = {
    findUser: (username, password) => {
        return users.find(u => u.username === username && u.password === password);
    }
};
