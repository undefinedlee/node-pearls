import fs from "fs";
import path from "path";

export default function(dir){
	var nodeModules = [];

	if(dir && fs.existsSync(dir)){
		if(fs.statSync(dir).isFile()){
			dir = path.dirname(dir);
		}

		if(fs.statSync(dir).isDirectory()){
			while(true){
				nodeModules.push(path.join(dir, "node_modules"));
				if(dir === "/"){
					break;
				}else{
					dir = path.dirname(dir);
				}
			}
		}
	}

	return nodeModules;
};