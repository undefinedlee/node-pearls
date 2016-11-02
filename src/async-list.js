// 异步列表
export default function(list){
	return new Promise(function(resolve, reject){
		var count = list.length,
			results = [];
		if(list && count > 0){
			list.forEach((item, index) => {
				item(result => {
					results[index] = result;
					count --;
					if(count === 0){
						resolve(...results);
					}
				});
			});
		}else{
			resolve();
		}
	});
};