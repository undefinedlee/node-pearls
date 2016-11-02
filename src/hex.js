const Index = "0123456789abcdefghijklmnopqrstuvwxyz";
// 进制转换
export default function(num, _Index){
	if(num == 0)
		return "0";

	_Index = _Index || Index;

	const hex = _Index.length;

	var result = [],
		item = 1;
	while(num >= item){
		result.unshift(_Index[(num % (item * hex)) / item | 0]);
		item *= hex;
	}
	return result.join("");
};