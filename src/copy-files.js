import fs from "fs";
import path from "path";
import mkdirs from "./mkdirs";
import asyncList from "./async-list";

function copyFile(src, dist, callback){
    mkdirs.sync(path.dirname(dist));
    var fileReadStream = fs.createReadStream(src);
    var fileWriteStream = fs.createWriteStream(dist);
    fileReadStream.pipe(fileWriteStream);
    fileWriteStream.on("close", callback);
}

export default function(files){
    if(!(files instanceof Array)){
        files = [files];
    }

    return asyncList(files.map(function(file){
        return function(callback){
            copyFile(file.src, file.dist, callback);
        };
    }));
}