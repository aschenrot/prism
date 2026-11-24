import { z } from 'zod';
import { idSchema } from './records';
export const projectSchema = z.object({
  id: idSchema,
  title: z.string().trim().min(1).max(120),
  root: z.string().min(1),
  storage: z.enum(['standalone','repository']),
  profiles: z.array(z.enum(['core','game','rust','product','project'])).default(['core'])
}).strict();
export const registrySchema = z.array(projectSchema).min(1).max(40).superRefine((items,ctx)=>{
  if(new Set(items.map(p=>p.id)).size!==items.length)ctx.addIssue({code:'custom',message:'Duplicate project IDs'});
});
export type ProjectConfig = z.infer<typeof projectSchema>;
export type ProjectInfo = Omit<ProjectConfig,'root'>;
export type RepositoryFile = { path:string; kind:'documentation'|'source'|'manifest'; size:number };
export type RepositoryIndex = { files:RepositoryFile[]; truncated:boolean };
