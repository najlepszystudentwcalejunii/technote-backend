require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const { logger, logEvents } = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
const connectDB = require("./config/dbConn");
const mongoose = require("mongoose");
const PORT = process.env.PORT | 3500;

app.use(logger);

connectDB();

app.use(express.urlencoded({ extended: false }));
app.use(cors(corsOptions));

app.use(express.json());

app.use(cookieParser());

app.use("/", express.static(path.join(__dirname, "/public")));

app.use("/", require("./routes/root"));
app.use("/auth", require("./routes/authRoutes.js"));
app.use("/users", require("./routes/userRoutes.js"));
app.use("/notes", require("./routes/notesRoutes.js"));

app.all("/*all", (req, res) => {
   res.status(404);
   if (req.accepts("html")) {
      res.sendFile(path.join(__dirname, "views", "404.html"));
   } else if (req.accepts("json")) {
      res.json({ message: "404 Not Found" });
   } else {
      res.type("text").send("404 Not Found");
   }
});

app.use(errorHandler);

mongoose.connection.once("open", () => {
   console.log("Connected to MongoDB");
   app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
   });
});

mongoose.connection.on("error", (err) => {
   console.log(err);
   logEvent(
      `${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
      "mongoErrLog.log"
   );
});
