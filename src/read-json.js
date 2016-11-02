import fs from "fs";
import console from "cli-console";

function parseJson(content, file){
	// 删除注释
	content = content.replace(/"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/\*[\S\s]*?\*\/|\/\/.*/g, function(match){
		if(/^["']/.test(match)){
			// 排除字符串中的注释符
			return match;
		}else{
			return "";
		}
	});

	// 解析json
	try{
		content = JSON.parse(content.trim());
	}catch(e){
		console.error("解析json文件错误");
		console.log(file);
		console.log(content);
		content = null;
		//throw e;
	}

	return content;
}

// 异步读取json文件
function readJson(file, callback){
	fs.exists(file, function(isExists){
		if(isExists){
			fs.readFile(file, {
				encoding: "utf8"
			}, function(err, content){
				if(err){
					console.error(`读取文件${file}失败`);
					console.log(err);
					//throw err;
					callback(null);
					return;
				}

				callback(parseJson(content, file));
			});
		}else{
			callback(null);
		}
	});
}

// 同步读取json文件
readJson.sync = function(file){
	if(fs.existsSync(file)){
		let content = fs.readFileSync(file, {
			encoding: "utf8"
		});

		return parseJson(content, file);
	}else{
		return null;
	}
};

export default readJson;