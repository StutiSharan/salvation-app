const mongoose = require("mongoose");

const CandidateSchema = new mongoose.Schema({
  candidateId:{type:String,unique:true,required:true},
  fullName:{type:String,required:true},
  fatherName:{type:String,required:true},
  address:{type:String,required:true},
  mobile:{type:String,required:true},
  resumeFilePath:{type:String,default:""},
  aadhaarFilePath:{type:String,default:""},
  createdAt:{type:Date,default:Date.now}
});

module.exports = mongoose.model("Candidate",CandidateSchema,"candidates");
