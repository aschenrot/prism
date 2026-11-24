import {createProjectBackup,verifyProjectBackup,restoreProjectBackup} from './projectBackup';
const [command,source,destination,...extra]=process.argv.slice(2);
try{
 if(!source||extra.length||!['create','verify','restore'].includes(command)||(command==='verify'?!!destination:!destination))throw new Error('Usage: npm run backup -- create <data-root> <new-backup-directory> | verify <backup-directory> | restore <backup-directory> <new-data-root>');
 const result=command==='create'?await createProjectBackup(source,destination):command==='restore'?await restoreProjectBackup(source,destination):await verifyProjectBackup(source);
 console.log(command+' complete: '+result.files.length+' files. Backup timestamp: '+result.createdAt);
}catch(e){console.error(e instanceof Error?e.message:String(e));process.exitCode=1;}
