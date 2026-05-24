const fs = require("fs");
const path = require("path");
const os = require("os");
const getDriveClient = require("./getDriveClient");

exports.uploadToDrive = async (file, folderId, fileName) => {
  const drive = await getDriveClient();

  const tempPath = path.join(os.tmpdir(), `${Date.now()}-${fileName}`);
  fs.writeFileSync(tempPath, file.buffer);

  const response = await drive.files.create({
    requestBody:{
      name:fileName,
      parents:[folderId]
    },
    media:{
      mimeType:file.mimetype,
      body:fs.createReadStream(tempPath)
    },
    fields:"id"
  });

  fs.unlinkSync(tempPath);

  return response.data.id;
};
