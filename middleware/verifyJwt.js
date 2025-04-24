const jwt = require("jsonwebtoken");

const verifyJwt = (req, res, next) => {
   const authHeader =
      req.headers["authorization"] || req.headers["authorization"];

   if (!authHeader?.startsWith("Bearer "))
      return res.status(401).json({ message: "Unauthorized" });

   const token = authHeader.split(" ")[1];
   if (!token) return res.status(401).json({ message: "Token missing" });

   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err)
         return res.status(403).json({ message: "Invalid or expired token" });
      req.user = decoded.UserInfo.username;
      req.roles = decoded.UserInfo.roles;
      next();
   });
};

module.exports = verifyJwt;
