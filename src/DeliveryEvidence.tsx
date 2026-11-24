import { GitCommitHorizontal, ArrowUpRight,RefreshCw } from 'lucide-react';
import type { ProjectRecord } from '../shared/records';
import RouteLink from './RouteLink';
import { linkedCommits,reconcileHistory,type GitHistory,type CommitEvidence } from '../shared/delivery';
type HistoryProps={history:GitHistory|undefined;loading:boolean;error:boolean;onRefresh:()=>void};
function Context({history,loading,error,onRefresh}:HistoryProps){
  return <div className="delivery-context"><span>{error?'Could not refresh Git history.':loading&&!history?'Reading local Git history…':history?.state==='available'?'HEAD '+history.head.slice(0,8)+(history.truncated?' · latest 100 commits':'')+(history.shallow?' · shallow clone':''):history?.message||'No Git history available.'}</span><button type="button" className="secondary" onClick={onRefresh} disabled={loading}><RefreshCw size={13}/> Refresh</button></div>;
}
function CommitRow({commit}:{commit:CommitEvidence}){
  return <div className="commit-row"><GitCommitHorizontal size={16}/><div><strong>{commit.subject||'(no subject)'}</strong><small><code>{commit.sha.slice(0,10)}</code> · {new Date(commit.date).toLocaleString()}</small></div></div>;
}
export function RecordEvidence({record,history,loading,error,onRefresh}:HistoryProps&{record:ProjectRecord}){
  const commits=linkedCommits(record,history);
  return <section className="delivery-panel"><div className="eyebrow">DELIVERY EVIDENCE</div><Context {...{history,loading,error,onRefresh}}/>
    {history?.state==='available'&&<>{commits.length?commits.map(c=><CommitRow key={c.sha} commit={c}/>):<p className="link-empty">No linked change found in the loaded history.</p>}{(record.implementationCommits||[]).some(sha=>!commits.some(c=>c.sha===sha))&&<p className="link-empty">Some explicitly referenced historical revisions are outside the loaded history or not reachable.</p>}<p className="link-empty">Linked commits establish attribution, not acceptance. See Quality for local project verification evidence. A project-wide check does not establish individual task acceptance.</p></>}
  </section>;
}
export function Changes({records,onSelect,hrefFor,...props}:HistoryProps&{records:ProjectRecord[];onSelect:(id:string)=>void;hrefFor:(id:string)=>string}){
  const history=props.history;
  const byId=new Map(records.map(r=>[r.id,r]));
  const result=history?.state==='available'?reconcileHistory(records,history):undefined;
  return <section className="changes-panel"><Context {...props}/>{history?.state==='available'&&result&&<>
    <div className="changes-summary"><div><small>Loaded commits</small><strong>{history.commits.length}</strong></div><div><small>No explicit link</small><strong>{result.unlinked.length}</strong></div><div><small>Unresolved references</small><strong>{result.unresolved.length+result.invalid.length}</strong></div></div>
    <p className="overview-note">Current HEAD ancestry only. A commit may legitimately be unlinked. Historical references are reviewed exact hashes, not inferred from titles. No task status is changed automatically.</p>
    {history.commits.map(c=>{
      const ids=[...new Set([...c.recordIds,...records.filter(r=>r.implementationCommits?.includes(c.sha)).map(r=>r.id)])];
      return <article className="change-entry" key={c.sha}><CommitRow commit={c}/><div className="change-links">{ids.map(id=>byId.has(id)?<RouteLink key={id} className="secondary" href={hrefFor(id)} onNavigate={()=>onSelect(id)}>{byId.get(id)?.title}<ArrowUpRight size={12}/></RouteLink>:<span className="relationship-warning" key={id}>Unresolved: {id}</span>)}{c.invalidReferences.map((value,i)=><span className="relationship-warning" key={i}>Invalid reference: {value||'(empty)'}</span>)}{!ids.length&&!c.invalidReferences.length&&<span className="link-empty">No explicit record reference</span>}</div></article>;
    })}
  </>}</section>;
}
