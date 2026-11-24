import type { ProjectRecord } from '../shared/records';
export default function Artwork({record}:{record:ProjectRecord}) {
  return <div className={'artwork '+record.accent} aria-hidden="true"><svg viewBox="0 0 300 160" fill="none">
    <circle cx="150" cy="80" r="62" stroke="currentColor" opacity=".25"/><circle cx="150" cy="80" r="46" stroke="currentColor" opacity=".5"/>
    <path d="M150 15 220 80 150 145 80 80Z M150 34 199 80 150 126 101 80Z" stroke="currentColor"/>
    <path d="M150 34 150 126 M101 80H199 M80 80 220 80" stroke="currentColor" opacity=".25"/>
    <circle cx="150" cy="80" r="12" fill="currentColor" opacity=".8"/>
  </svg><span>{record.type.toUpperCase()} / PRISM</span></div>;
}
