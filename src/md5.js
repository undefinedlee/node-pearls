import crypto from "crypto";

export default function(content){
	var sha1 = crypto.createHash('sha1');
	sha1.update(content);
	return sha1.digest('hex');
};