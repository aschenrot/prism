import { z } from 'zod';
import { idSchema } from './records';
import { githubRepositorySchema } from './hostedVerification';
export const projectSchema = z.object({
  id: idSchema,
  title: z.string().trim().min(1).max(120),
  root: z.string().min(1),
  storage: z.enum(['standalone','repository']),
  githubRepository: githubRepositorySchema.optional(),
  profiles: z.array(z.enum(['core','game','rust','product','project'])).default(['core'])
}).strict();
export const registrySchema = z.array(projectSchema).min(1).max(40).superRefine((items,ctx)=>{
  if(new Set(items.map(p=>p.id)).size!==items.length)ctx.addIssue({code:'custom',message:'Duplicate project IDs'});
  if(items.some(p=>p.githubRepository&&p.storage!=='repository'))ctx.addIssue({code:'custom',message:'GitHub evidence requires repository storage'});
});
export type ProjectConfig = z.infer<typeof projectSchema>;
export type ProjectInfo = Omit<ProjectConfig,'root'>;
export type RepositoryFile = { path:string; kind:'documentation'|'source'|'manifest'; size:number };
export type RepositoryIndex = { files:RepositoryFile[]; truncated:boolean };

export const createWorkspaceSchema=z.strictObject({
 title:z.string().trim().min(1).max(120),
 profile:z.enum(['general','product','game']),
 requestId:z.string().regex(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/)
});
export type CreateWorkspaceInput=z.infer<typeof createWorkspaceSchema>;
export type WorkspaceCreationAvailability={available:boolean;reason?:string};
export function workspaceProfile(profile:CreateWorkspaceInput['profile']):ProjectConfig['profiles']{
 return profile==='game'?['core','game','product','project']:profile==='product'?['core','product','project']:['core','project'];
}
