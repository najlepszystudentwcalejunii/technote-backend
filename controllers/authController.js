const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

//@desc Login
//@route POST /auth
//@access public
const login = asyncHandler(async (req, res) => {
   const { username, password } = req.body;
   if (!username || !password)
      return res.status(400).json({ message: "All fields are required" });

   const foundUser = await User.findOne({ username }).exec();
   if (!foundUser || !foundUser.active)
      return res.status(401).json({ message: "User not found" });

   const pwdMatch = await bcrypt.compare(password, foundUser.password);
   if (!pwdMatch) return res.status(401).json({ message: "Unauthorized" });

   const accessToken = jwt.sign(
      {
         UserInfo: {
            username: foundUser.username,
            roles: foundUser.roles,
         },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1m" }
   );
   const refreshToken = jwt.sign(
      {
         username: foundUser.username,
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "15m" }
   );

   res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 1000 * 60 * 60 * 24,
   });
   res.json({ accessToken });
});

//@desc Refresh token
//@route GET /auth/refresh
//@access public - because access token has expired
const refresh = (req, res) => {
   const cookies = req.cookies;
   console.log(JSON.stringify(cookies));
   if (!cookies.jwt) return res.status(401).json({ message: "Unauthorized" });
   const refreshToken = cookies.jwt;

   jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      asyncHandler(async (err, decoded) => {
         if (err) return res.status(403).json({ message: "Forbidden" });

         const foundUser = await User.findOne({ username: decoded.username });
         if (!foundUser) res.status(401).json({ message: "Unauthorized" });

         const accessToken = jwt.sign(
            {
               UserInfo: {
                  username: foundUser.username,
                  roles: foundUser.roles,
               },
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "1m" }
         );
         res.json({ accessToken });
      })
   );
};

//@desc Logout
//@route POST /auth
//@access public - just clear cookie
const logout = (req, res) => {
   const cookies = req.cookies;
   console.log("cookies: " + JSON.stringify(cookies));
   if (!cookies?.jwt)
      return res.status(200).json({ message: "No refresh token to delete" });
   res.clearCookie("jwt", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
   });
   res.json({ message: "Cookie cleared" });
};

module.exports = { login, refresh, logout };
