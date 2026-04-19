const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.send(`
        <h1>OAuth Login</h1>
        <ul>
            <li><a href="/auth/github">Login with GitHub</a></li>
            <li><a href="/auth/facebook">Login with Facebook</a></li>
        </ul>
    `);
});

router.get("/profile", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/");
  }
  res.send(`
        <h1>Welcome ${req.user.displayName}</h1>
        <p>ID: ${req.user.id}</p>
        <p>Provider: ${req.user.provider}</p>
        <img src="${req.user.photos ? req.user.photos[0].value : ""}" width="100" />
        <br><br>
        <a href="/auth/logout">Logout</a>
        <pre>${JSON.stringify(req.user, null, 2)}</pre>
    `);
});

module.exports = router;
