'use client';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';

type Props = {
  images: string[];
  disabled: boolean;
  onChange: (images: string[]) => void;
  onRemove: (image: string) => void;
};

function SortablePhoto({ image, index, disabled, onRemove }: {
  image: string; index: number; disabled: boolean; onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: image, disabled });
  return <div ref={setNodeRef} className={'sortable-photo' + (isDragging ? ' dragging' : '')}
    style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 2 : undefined }}>
    <button type="button" ref={setActivatorNodeRef} className="photo-drag-handle" disabled={disabled}
      {...attributes} {...listeners} aria-label={`Mover foto ${index + 1}${index === 0 ? ', portada' : ''}`}>
      <img src={image} alt={`Foto ${index + 1}`} draggable={false} />
      <span className="photo-position"><GripVertical size={12} />{index === 0 ? 'Portada' : index + 1}</span>
    </button>
    <button type="button" className="photo-remove" disabled={disabled}
      aria-label={`Quitar foto ${index + 1}`} onClick={onRemove}><X size={14} /></button>
  </div>;
}

export default function PhotoSorter({ images, disabled, onChange, onRemove }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  function reorder({ active, over }: DragEndEvent) {
    if (disabled || !over || active.id === over.id) return;
    const from = images.indexOf(String(active.id)), to = images.indexOf(String(over.id));
    if (from >= 0 && to >= 0) onChange(arrayMove(images, from, to));
  }
  return <>
    {images.length > 0 && <p className="photo-sort-hint">Arrastrá las fotos para ordenarlas. La primera es la portada. Guardá el artículo para aplicar los cambios.</p>}
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={reorder}
      accessibility={{
        screenReaderInstructions: { draggable: 'Para mover una foto, presioná espacio. Usá las flechas para cambiarla de lugar, espacio para soltarla o Escape para cancelar.' },
        announcements: {
          onDragStart: ({ active }) => `Seleccionaste la foto ${images.indexOf(String(active.id)) + 1}.`,
          onDragOver: ({ over }) => over ? `Posición ${images.indexOf(String(over.id)) + 1}. La primera posición es la portada.` : 'Fuera de las fotos.',
          onDragEnd: ({ active, over }) => over ? `Foto movida a la posición ${images.indexOf(String(over.id)) + 1}.` : `La foto ${images.indexOf(String(active.id)) + 1} mantiene su lugar.`,
          onDragCancel: () => 'Movimiento cancelado.',
        },
      }}>
      <SortableContext items={images} strategy={rectSortingStrategy}>
        <div className="photo-sorter" aria-label="Fotos del artículo">
          {images.map((image, index) => <SortablePhoto key={image} image={image} index={index}
            disabled={disabled} onRemove={() => onRemove(image)} />)}
        </div>
      </SortableContext>
    </DndContext>
  </>;
}
