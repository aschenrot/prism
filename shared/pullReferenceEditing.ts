import {z} from 'zod';
import {pullReferencesSchema,type PullReference} from './hostedVerification';
export const pullReferenceDraftSchema=z.strictObject({revision:z.string().regex(/^[a-f0-9]{64}$/),original:pullReferencesSchema,draft:z.array(z.strictObject({repository:z.string().max(220),number:z.string().max(16)})).max(5)});
export type PullReferenceDraft=z.infer<typeof pullReferenceDraftSchema>;
export function pullReferenceDraft(revision:string,refs:PullReference[]):PullReferenceDraft{return {revision,original:refs,draft:refs.map(r=>({repository:r.repository,number:String(r.number)}))};}
export function parsePullReferenceDraft(draft:PullReferenceDraft['draft']){
 return pullReferencesSchema.safeParse(draft.map(row=>({repository:row.repository.trim(),number:/^[1-9]\d{0,15}$/.test(row.number)?Number(row.number):NaN})));
}
