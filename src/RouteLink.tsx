import type { ComponentPropsWithoutRef } from 'react';
// A genuine link: modified clicks, context menus and opening in a new tab retain browser behavior.
type Props=Omit<ComponentPropsWithoutRef<'a'>,'href'|'onClick'>&{href:string;onNavigate:()=>void};
export default function RouteLink({href,onNavigate,children,...props}:Props){
  return <a {...props} href={href} onClick={event=>{
    event.stopPropagation();
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();onNavigate();
  }}>{children}</a>;
}
