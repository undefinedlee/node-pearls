/** 数据处理管道
 * @example
 	pipe(tasks)
 	.start(params)
 	.end(function(){
 		...
 	})
 * @example
 	pipe([
 		function(...params){
			console.log(params);

			return "abc";
 		},
 		function(...params){
 			console.log(params);

			var callback = this.async();
			setTimeout(function(){
				callback(4, 5, 6);
			}, 1000);
 		},
 		function(...params){
			console.log(params);

			return "complete";
 		}
 	])
 	.start(1, 2, 3)
 	.end(function(...params){
		console.log(params);
 	});
 */
export default function(tasks){
	var onEnd;

	function run(...params){
		let task = tasks.shift();

		if(task){
			let isSync = true;

			let result = task.apply({
				async: function(){
					isSync = false;
					return function(...result){
						run(...result);
					};
				}
			}, params);

			if(isSync){
				run(result);
			}
		}else{
			onEnd(...params);
		}
	};

	return {
		start: function(...params){
			var listeners = [];
			var result;

			onEnd = function(...params){
				result = params;

				listeners.forEach(function(listener){
					listener(...params);
				});
			};

			run(...params);

			return {
				end: function(listener){
					if(result){
						listener(...result);
					}else{
						listeners.push(listener);
					}
					return this;
				}
			};
		}
	};
};