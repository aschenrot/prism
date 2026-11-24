import { Buffer } from 'node:buffer';
import { indexRepository,readRepositoryFile } from './repository';
import { matchFields,searchResultLimit,type FileHit,type ProjectSearchResult } from '../shared/search';
const MAX_CONTENT_FILES=400,MAX_CONTENT_BYTES=8*1024*1024,MAX_PREVIEW_BYTES=512_000;
export async function searchRepository(root:string,terms:string[]):Promise<{hits:FileHit[];total:number;repository:ProjectSearchResult['repository']}>{
 const index=await indexRepository(root);
 const hits:FileHit[]=[];let scanned=0,unread=0,attempted=0,bytes=0,truncated=index.truncated;
 for(const f of index.files){
  const fields=[{field:'Path',text:f.path,weight:8}];let previewAvailable=false;
  if(f.size<=MAX_PREVIEW_BYTES&&attempted<MAX_CONTENT_FILES&&bytes+f.size<=MAX_CONTENT_BYTES){
   attempted++;
   try{const read=await readRepositoryFile(root,f.path);const size=Buffer.byteLength(read.content,'utf8');bytes+=size;
    if(bytes<=MAX_CONTENT_BYTES){fields.push({field:'Content',text:read.content,weight:1});scanned++;previewAvailable=true;}
    else{unread++;truncated=true;}
   }catch{unread++;truncated=true;}
  }else{unread++;truncated=true;}
  const match=matchFields(fields,terms);if(match)hits.push({path:f.path,kind:f.kind,previewAvailable,...match});
 }
 hits.sort((a,b)=>b.score-a.score||a.path.localeCompare(b.path));
 return {hits:hits.slice(0,searchResultLimit),total:hits.length,repository:{state:'searched',indexed:index.files.length,scanned,unread,truncated}};
}
