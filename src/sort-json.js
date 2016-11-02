// 给json的key排序
// 避免相同的json由于key的顺序不一样，生成的文件md5不一样
// 暂时没做深度排序
export default function(obj){
	var newObj = {};

	Object.keys(obj).sort().forEach(key => {
		newObj[key] = obj[key];
	});

	return newObj;
}