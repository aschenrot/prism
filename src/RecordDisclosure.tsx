import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

// Native disclosure keeps content available without a second state or navigation system.
export default function RecordDisclosure({title,summary,children}:{title:string;summary?:string;children:ReactNode}){
 return <details className="record-reading record-disclosure"><summary><span className="record-disclosure-title">{title}</span>{summary&&<span className="record-disclosure-count">{summary}</span>}<ChevronRight size={18} aria-hidden="true"/></summary><div className="record-disclosure-body">{children}</div></details>;
}
