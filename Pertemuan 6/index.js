require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");

const app = express();

require("./config/passport");

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: true,
  }),
);

app.use(passport.initialize());
app.use(passport.session());

const indexRouter = require("./routes/index");
const authRouter = require("./routes/auth");

app.use("/", indexRouter);
app.use("/auth", authRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
