const disk = require('diskusage')
const fs = require('fs');
const {exec}=require('child_process')
const executeCmd=(cmd)=>{
    return new Promise((resolve,reject)=>{
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                // console.log(`error: ${error.message}`);
                return reject(error.message)
            }
            if (stderr) {
                // console.log(`stderr: ${stderr}`);
                return reject(stderr)
            }
            // console.log(`stdout: ${stdout}`);
            resolve(stdout.trim())
        });
    })
}
disk.check('/media/sonmaster/USB')
.then(async(info)=>{
    // console.log(info.available);
    console.log(info.free);
    console.log(info.total);
    let freePercent = Math.round(info.free*100/info.total)
    console.log('free disk:',freePercent)
    let lastFile = await executeCmd('ls -t /media/sonmaster/USB/cam0 | tail -1')
    console.log('last file:'+lastFile)
    if(lastFile===''){
        return
    }
    let fileRegex = lastFile.split('T')
    let dayRegex= fileRegex[0]
    let hourRegex = fileRegex[1].split('-')[0]
    let deleteRegex = dayRegex+'T'+hourRegex
    console.log('last day video:'+deleteRegex)
    let cmd = 'rm -rf /media/sonmaster/USB/cam0/'+deleteRegex.trim()+'*'
    console.log(cmd)
    let result =await executeCmd(cmd)
    console.log(result)

})  
.catch(err=>{
    console.log('error check disk:',err)
})