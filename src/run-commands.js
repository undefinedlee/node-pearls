import fs from "fs";
import path from "path";
import console from "cli-console";
import { spawn } from "child_process";

export default function (commands, options){
    commands = commands.split("\n").map(command => command.trim()).filter(command => !!command);

    options = options || {};
    const verbose = options.verbose !== false;
    delete options.verbose;
    var cwd = options.cwd || process.cwd();

    return new Promise(function(resolve, reject){
        var stdout = [];
        var stderr = [];

        (function runCommand(){
            if(commands.length === 0){
                resolve(stdout.join(""));
                return;
            }

            if(!fs.existsSync(cwd)){
                console.error(`命令执行的目录${cwd}不存在`);
                return;
            }

            var commandStr = commands.shift();

            if(verbose){
                console.info(commandStr);
            }

            var command = (function(commandItems){
                return {
                    name: commandItems.shift(),
                    argv: commandItems
                };
            })(commandStr.split(/\s+/));

            if(command.name === "cd"){
                cwd = path.join(cwd, command.argv[0]);
                runCommand();
            }else{
                options.cwd = cwd;
                
                command = spawn(command.name, command.argv, options);

                command.stdout.on('data', (data) => {
                    let info = data.toString("utf8");
                    stdout.push(info);
                    if(verbose){
                        console.log(info.trim());
                    }
                });

                command.stderr.on('data', (data) => {
                    let info = data.toString("utf8");
                    stderr.push(info);
                    console.error(info.trim());
                });

                command.on('close', (code) => {
                    if(code === 0){
                        runCommand();
                    }else{
                        reject(new Error(`命令${commandStr}执行错误`));
                    }
                });
            }
        })();
    });
}