const babel = require("babel-core");
// import template from "babel-template";
import astQuery from "js-ast-query";

const types = babel.types;
// 没有匹配到预设
// const NO_FOUND = "__@no-found@__";
const NO_FOUND = {};

export default function(code, presets){
	presets = Object.keys(presets).map(function(preset){
		var value = presets[preset];
		var ast = astQuery.JS.parse(preset);
		return {
			type: ast.type,
			test: function(input){
				return astQuery.JS.compare(ast, input);
			},
			value: value
		};
	});

	function findValue(node){
		var result = presets.find(function(item){
			return item.test(node);
		});

		if(result){
			return result.value;
		}

		return NO_FOUND;
	}

	function test(node){
		var value;
		var left;
		var right;

		if(!node){
			return NO_FOUND;
		}

		switch(node.type){
			case "Literal":
				return node.raw;
			case "StringLiteral":
			case "NumericLiteral":
			case "BooleanLiteral":
				return node.value;
			case "NullLiteral":
				return null;
			case "Identifier":
			case "MemberExpression":
				return findValue(node);
			case "UnaryExpression":
				value = test(node.argument);
				if(value === NO_FOUND){
					return NO_FOUND;
				}else{
					switch(node.operator){
						case "!":
							return !value;
						case "+":
							return +value;
						case "-":
							return -value;
					}
				}
			case "BinaryExpression":
				left = test(node.left);
				right = test(node.right);
				if(left === NO_FOUND || right === NO_FOUND){
					return NO_FOUND;
				}else{
					switch(node.operator){
						case "==":
							return left == right;
						case "===":
							return left === right;
						case "!=":
							return left != right;
						case "!==":
							return left !== right;
						case "+":
							return left + right;
						case "-":
							return left - right;
						case "*":
							return left * right;
						case "/":
							return left / right;
						case "&":
							return left & right;
						case "|":
							return left | right;
					}
				}
			case "LogicalExpression":
				left = test(node.left);
				right = test(node.right);

				switch(node.operator){
					case "&&":
						if(left !== NO_FOUND && !left){
							return false;
						}
						if(right !== NO_FOUND && !right){
							return false;
						}
						return NO_FOUND;
					case "||":
						if(left !== NO_FOUND && left){
							return true;
						}
						if(right !== NO_FOUND && right){
							return true;
						}
						return NO_FOUND;
				}
			default:
				return NO_FOUND;
		}
	}

	const IfAndConditionalVisitor = function(path){
		let node = path.node;
		let result = test(node.test);
		if(result !== NO_FOUND){
			if(result){
				if(node.consequent.type === "BlockStatement"){
					path.replaceWithMultiple(node.consequent.body);
				}else{
					path.replaceWith(node.consequent);
				}
			}else{
				if(node.alternate){
					if(node.alternate.type === "BlockStatement"){
						path.replaceWithMultiple(node.alternate.body);
					}else{
						path.replaceWith(node.alternate);
					}
				}else{
					path.remove();
				}
			}
		}
	}

	var visitor = {
			IfStatement: IfAndConditionalVisitor,
			ConditionalExpression: IfAndConditionalVisitor
		};

	var presetTypes = {};
	presets.forEach(function(preset){
		if(!presetTypes[preset.type]){
			presetTypes[preset.type] = [];
		}

		presetTypes[preset.type].push(function(path){
			if(preset.test(path.node)){
				let parentNode = path.parentPath.node;
				//
				if(parentNode.type === "MemberExpression"){
					return;
				}
				//
				if(parentNode.type === "AssignmentExpression" && parentNode.left === path.node){
					return;
				}

				let value = preset.value;
				if(value === null){
					value = types.NullLiteral();
				}else{
					switch(typeof value){
						case "boolean":
							value = types.BooleanLiteral(value);
							break;
						case "string":
							value = types.StringLiteral(value);
							break;
						case "number":
							value = types.NumericLiteral(value);
							break;
					}
				}
				path.replaceWith(value);
			}
		});
	});

	Object.keys(presetTypes).forEach(function(type){
		visitor[type] = function(path){
			presetTypes[type].forEach(v => v(path));
		};
	});

	try{
		code = babel.transform(code, {
			compact: false,
			sourceMaps: process.env.SM ? "inline" : false,
			plugins: [
				function ({ types: t }) {
					return {
						visitor: visitor
					};
				}
			]
		}).code;
	}catch(e){
		console.error("remove invalid error");
		console.log(e);
	}

	return code;
}