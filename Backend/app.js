const express=require("express");
const cors=require("cors");
const connectDB=require("./config/db");
require("dotenv").config();

const app=express();
connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/candidates",require("./routes/candidateRoutes"));
app.use("/api/employees",require("./routes/employeeRoutes"));
app.use("/api/auth",require("./routes/authRoutes"));
// app.use("/api/test", require("./routes/driveTest"));
// app.use("/auth", require("./routes/googleAuthRoutes"));

module.exports=app;
