require('./middlewares/googleAuth');
require('dotenv').config();
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const userRouter = require("./routes/user");
const requestRouter = require("./routes/request");
const cors = require("cors");

const http = require('http')
const connectDB = require("./config/database");
const paymentRouter = require("./routes/payment");
const initializeSocketConnection = require('./utils/socket');
const chatRouter = require('./routes/chat');
const passport = require('passport');

app.use(
  cors({
    origin: "http://localhost:5173", // must match your frontend
    credentials: true,               // allows sending cookies
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

const server = http.createServer(app);
initializeSocketConnection(server);

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use("/",authRouter);
app.use("/",profileRouter);
app.use("/",requestRouter);
app.use("/",userRouter);
app.use("/",paymentRouter);
app.use("/",chatRouter);

connectDB().then(() => {
  console.log("Database connected successfully");
  server.listen(7777, () => {
    console.log("Server is running on port 7777");
  });
});
