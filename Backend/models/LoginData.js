const mongoose=require("mongoose");

const LoginDataSchema=new mongoose.Schema({
  fullName:{type:String,required:true},
  phone:{type:String,required:true},
  otpStatus:{type:String,enum:["pending","verified"],default:"pending"},
  createdAt:{type:Date,default:Date.now},
  loginAt:{type:Date},
  lastLoggedInAt:{type:Date}
});

module.exports=mongoose.model("LoginData",LoginDataSchema,"Login_data");
