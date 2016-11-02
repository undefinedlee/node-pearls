import fs from "fs";
import path from "path";

export default function(projectPath, modName){
	while(projectPath && projectPath !== "/"){
		let modPath = path.join(projectPath, "node_modules", modName);
		if(fs.existsSync(modPath)){
			return modPath;
		}else{
			projectPath = path.dirname(projectPath);
		}
	}

	return null;
};