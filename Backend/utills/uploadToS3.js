import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../config/s3.js";
import path from "path";

/**
 * Dynamic S3 uploader
 *
 * @param {Object} file - multer file (memory storage)
 * @param {Object} options
 * @param {String} options.module - candidate | employee | admin
 * @param {String} options.documentType - aadhaar | resume | pan | offerLetter etc
 * @param {String} options.name - Full name (Ram / Stuti)
 * @param {String} options.id - CandidateId / EmployeeId
 *
 * @returns {String} s3Key
 */
export const uploadToS3 = async(file,{ module,documentType,name,id })=>{
	if(!file) throw new Error("File is required");

	const ext = path.extname(file.originalname);
	const safeName = name.replace(/\s+/g,"_");

	const fileName = `${safeName}_${id}_${documentType}${ext}`;

	const s3Key = `upload/${module}/${documentType}/${fileName}`;

	const command = new PutObjectCommand({
		Bucket: process.env.AWS_S3_BUCKET,
		Key: s3Key,
		Body: file.buffer,
		ContentType: file.mimetype
	});

	await s3.send(command);

	return s3Key; // store this in DB
};
