import { CircleDot } from 'lucide-react';
const statusClass = (status:string) => status === 'Ready' ? 'ready' : status === 'In progress' ? 'progress' : 'concept';
export default function Status({value}:{value:string}) { return <span className={'status '+statusClass(value)}><CircleDot size={12}/>{value}</span>; }
