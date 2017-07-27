const babel = require("babel-core");
import console from "cli-console";

// 查找代码里的所有依赖
function jsDeps (content){
	var deps = [];

	try{
		// 提取依赖
		babel.transform(content, {
			compact: false,
			plugins: [
				function ({ types: t }) {
					return {
						visitor: {
							CallExpression: {
								enter(path){
									let node = path.node;
									// 匹配require(string)
									if(node.callee.type === "Identifier" &&
										node.callee.name === "require" &&
										node.arguments[0] &&
										node.arguments[0].type === "StringLiteral" &&
										!path.scope.hasBinding("require")){
											deps.push(node.arguments[0].value);
									}
								}
							}
						}
					};
				}
			]
		});
	}catch(e){
		console.error("find deps error");
		console.log(e);
	}

	return deps;
};

jsDeps.replace = function(content, fn){
	if(typeof fn === "object"){
		let obj = fn;
		fn = function(key){
			var value = obj[key];
			if(typeof value === "object"){
				return value;
			}else if(typeof value !== "undefined"){
				return {
					modId: value
				};
			}
		};
	}

	try{
		// 提取依赖
		content = babel.transform(content, {
			compact: false,
			sourceMaps: process.env.SM ? "inline" : false,
			plugins: [
				function ({ types: t }) {
					// 根据modId的类型，生成相应的节点
					function createModId (modId) {
						switch(typeof modId){
							case "string":
								return t.StringLiteral(modId);
							case "number":
								return t.NumericLiteral(modId);
						}
						throw new Error("modId'" + modId + "'不是有效的类型");
					}
					// 向节点添加注释
					function addComments (node, comments) {
						if(!comments.trim()){
							return;
						}

						if(!node.trailingComments){
							node.trailingComments = [];
						}

						comments.split("\n").forEach(function(comment){
							node.trailingComments.push(t.StringLiteral(comment));
						});
					}

					return {
						visitor: {
							CallExpression: {
								enter(path){
									let node = path.node;
									// 匹配require(string)
									if(node.callee.type === "Identifier" &&
										node.callee.name === "require" &&
										node.arguments[0] &&
										node.arguments[0].type === "StringLiteral" &&
										!path.scope.hasBinding("require")){
											let modInfo = fn(node.arguments[0].value, path);

											if(!modInfo){
												return;
											}

											if(modInfo instanceof Array){
												if(modInfo.some(item => !!item.requireName)){
													path.replaceWith(t.ArrayExpression(modInfo.map(function(modInfo){
														var modId = createModId(modInfo.modId);
														if(modInfo.comments){
															addComments(modId, modInfo.comments);
														}

														return t.CallExpression(
																t.Identifier(modInfo.requireName || "require"),
																modId
															);
													})));
												}else{
													node.arguments[0] = t.ArrayExpression(modInfo.map(function(modInfo){
														var modId = createModId(modInfo.modId);
														if(modInfo.comments){
															addComments(modId, modInfo.comments);
														}
														return modId;
													}));
												}
												return;
											}

											if(!modInfo.modId){
												path.replaceWith(t.NullLiteral());
												return;
											}
											
											// 修改require的模块ID
											node.arguments[0] = createModId(modInfo.modId);
											// 修改require的方法名
											if(modInfo.requireName){
												node.callee.name = modInfo.requireName;
											}
											// 添加注释
											if(modInfo.comments){
												addComments(node.arguments[0], modInfo.comments);
											}
									}
								}
							}
						}
					};
				}
			]
		}).code;
	}catch(e){
		console.error("replace deps error");
		console.log(e);
		return "";
	}

	return content;
};

export default jsDeps;