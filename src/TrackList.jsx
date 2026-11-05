import { useTranslation } from "./i18n";
import { memo } from "react";
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Pause, Play } from "lucide-react";
function TrackRow({ track, index, active, playing, onPlay, onRemove }) {const { t: tr } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: track.id });
  return <div ref={setNodeRef} className={`track ${active ? "current" : ""} ${isDragging ? "sorting" : ""}`} style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 5 : undefined }}>
    <button className="drag-handle" {...attributes} {...listeners} aria-label={tr(`拖曳排序 ${track.title}`)} title={tr("拖曳排序；鍵盤按空白鍵後用方向鍵移動")}><GripVertical size={15} /></button>
    <button className="track-select" onClick={() => onPlay(track)} aria-label={tr(`播放 ${track.title}`)}><span className="track-number">{active ? playing ? <Pause size={12} /> : <Play size={12} /> : String(index + 1).padStart(2, "0")}</span><span className="track-copy"><strong>{track.title}</strong><small>{tr(track.detail || "本機音樂")}</small></span></button>
    <button className="icon-button remove-track" aria-label={tr(`移除 ${track.title}`)} title={tr("移除歌曲")} onClick={() => onRemove(track)}><Trash2 size={14} /></button>
  </div>;
}
export const TrackList = memo(function TrackList({ tracks, currentId, playing, onPlay, onRemove, onMove }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  return <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({ active, over }) => {if (over && active.id !== over.id) onMove(active.id, over.id);}}><SortableContext items={tracks.map((t) => t.id)} strategy={verticalListSortingStrategy}><div className="track-list">{tracks.map((t, i) => <TrackRow key={t.id} track={t} index={i} active={t.id === currentId} playing={playing} onPlay={onPlay} onRemove={onRemove} />)}</div></SortableContext></DndContext>;
});
