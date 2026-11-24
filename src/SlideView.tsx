import { AnimatePresence,motion,MotionConfig } from 'motion/react';
import { ChevronLeft,ChevronRight } from 'lucide-react';
import type { ProjectRecord } from '../shared/records';
import Artwork from './Artwork';
import Status from './Status';
import CollectionEditAction from './CollectionEditAction';
const excerpt=(body:string)=>body.trim().split('\n').find(line=>line.trim()&&!line.startsWith('#'))||'No description yet.';
export default function SlideView({active,slide,count,onPrevious,onNext,onEdit,onDirectEdit,disabled}:{active:ProjectRecord;slide:number;count:number;onPrevious:()=>void;onNext:()=>void;onEdit:()=>void;onDirectEdit:()=>void;disabled:boolean}){
  return <MotionConfig reducedMotion="user"><section className="presentation" aria-label="Presentation"><div className="slide-stage"><AnimatePresence mode="wait" initial={false}><motion.div className={'slide '+active.accent} key={active.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:.22}}><div className="slide-copy"><div className="eyebrow">PRISM / {active.type.toUpperCase()}</div><h2>{active.title}</h2><p>{excerpt(active.body)}</p><Status value={active.status}/></div><Artwork record={active}/></motion.div></AnimatePresence></div><div className="slide-controls"><button className="icon-button" aria-label="Previous slide" disabled={disabled||slide<=0} onClick={onPrevious}><ChevronLeft/></button><span>{Math.min(slide+1,count)} / {count}</span><button className="icon-button" aria-label="Next slide" disabled={disabled||slide>=count-1} onClick={onNext}><ChevronRight/></button><button className="secondary" disabled={disabled} onClick={onEdit}>Open record</button><CollectionEditAction record={active} onEdit={onDirectEdit} disabled={disabled}/></div></section></MotionConfig>;
}
