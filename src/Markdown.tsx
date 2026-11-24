import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// No raw HTML, external images, or clickable arbitrary URLs. Repo text is untrusted.
export default function MarkdownBody({body}:{body:string}){
  return <div className="markdown-body"><Markdown skipHtml remarkPlugins={[remarkGfm]} components={{
    a:({children})=><span className="markdown-link">{children}</span>,
    img:({alt})=><span className="markdown-image">[Image: {alt||'unavailable'}]</span>,
    input:({checked})=><input type="checkbox" checked={!!checked} disabled aria-label="Task status"/>
  }}>{body||'*No description yet.*'}</Markdown></div>;
}
