const multer=require("multer");

const storage=multer.memoryStorage();

const fileFilter=(req,file,cb)=>{
  // ✅ Allow PDFs
  if(file.mimetype==="application/pdf"){
    return cb(null,true);
  }

  // ✅ Allow ALL image types
  if(file.mimetype.startsWith("image/")){
    return cb(null,true);
  }

  // ❌ Reject everything else
  cb(new Error("Only PDF and image files allowed"),false);
};

const upload=multer({
  storage,
  limits:{ fileSize:10*1024*1024 },
  fileFilter
});

module.exports=upload;
