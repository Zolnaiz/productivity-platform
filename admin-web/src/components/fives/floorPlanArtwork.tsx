/**
 * How each piece of furniture and equipment is drawn on the floor plan: its
 * artwork, scaled into the size the object really is. Used by the editor's
 * canvas (FiveSFloorPlanSetup); the shapes are fixed drawings, so nothing here
 * depends on the editor's state beyond what is passed in.
 */
import React from 'react';
import { CANVAS_HEIGHT } from './floorPlanGeometry';
import { CanvasColours, strokeInk, tint } from './floorPlanTheme';
import { FloorPlanObject, FloorPlanObjectType } from '../../types/fiveS.types';

/**
 * The box each thing's artwork is drawn in.
 *
 * The drawings are full of fixed insets — a bin's lid 5 units in, a desk's
 * monitor 12 — which were tuned when every object was about ninety units
 * across. Now that a chair is 0.5 m and a plan can be calibrated to anything,
 * those insets would turn inside out: a rectangle inset by 10 on each side of a
 * 12-unit chair has a width of −8, and SVG simply does not draw it.
 *
 * So each drawing keeps its own box, at the proportions it was drawn for, and
 * is scaled into whatever the object actually measures. The artwork is then
 * never asked to be smaller than its own detail.
 */
const ARTWORK_BOX: Partial<Record<FloorPlanObjectType, { width: number; height: number }>> = {
  wall: { width: 160, height: 10 },
  door: { width: 74, height: 18 },
  desk: { width: 86, height: 52 },
  chair: { width: 34, height: 34 },
  table: { width: 92, height: 70 },
  shelf: { width: 132, height: 42 },
  cabinet: { width: 72, height: 58 },
  pallet: { width: 90, height: 60 },
  racking: { width: 120, height: 50 },
  workbench: { width: 100, height: 45 },
  printer: { width: 54, height: 44 },
  equipment: { width: 58, height: 46 },
  whiteboard: { width: 120, height: 48 },
  sofa: { width: 110, height: 48 },
  plant: { width: 38, height: 46 },
  waste_bin: { width: 34, height: 42 },
  sink: { width: 58, height: 42 },
};

export const renderFloorPlanObject = (
  object: FloorPlanObject,
  selected: boolean,
  onPointerDown: (event: React.PointerEvent<SVGGElement>) => void,
  colours: CanvasColours,
) => {
  const centerX = object.x + object.width / 2;
  const centerY = object.y + object.height / 2;
  const art = { x: 0, y: 0, ...(ARTWORK_BOX[object.type] ?? { width: object.width, height: object.height }) };
  const artCentreX = art.width / 2;
  const artCentreY = art.height / 2;
  // Read right to left: draw in the artwork's own box, squeeze it into the size
  // this object really is, move it into place, and turn it where it points.
  const transform = [
    `rotate(${object.rotation || 0} ${centerX} ${centerY})`,
    `translate(${object.x} ${object.y})`,
    `scale(${art.width ? object.width / art.width : 1} ${art.height ? object.height / art.height : 1})`,
  ].join(' ');
  const objectLabel = object.label.length > 18 ? `${object.label.slice(0, 16)}...` : object.label;
  let shape: React.ReactNode;

  if (object.type === 'wall') {
    shape = (
      <rect
        x={art.x}
        y={art.y}
        width={art.width}
        height={art.height}
        fill={tint('#111827', colours)}
        transform={transform}
      />
    );
  } else if (object.type === 'door') {
    shape = (
      <g transform={transform} stroke={strokeInk('#111827', colours)} strokeWidth="3" fill="none">
        <line x1={art.x} y1={art.y + art.height} x2={art.x + art.width} y2={art.y + art.height} />
        <path d={`M ${art.x} ${art.y + art.height} A ${art.width} ${art.width} 0 0 1 ${art.x + art.width} ${art.y}`} />
      </g>
    );
  } else if (object.type === 'desk') {
    shape = (
      <g transform={transform}>
        <rect x={art.x} y={art.y} width={art.width} height={art.height} rx="5" fill={tint('#f8fafc', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        <rect x={art.x + 12} y={art.y + 10} width={art.width - 24} height="10" fill={tint('#dbeafe', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="1" />
        <line x1={art.x + 18} y1={art.y + art.height - 10} x2={art.x + art.width - 18} y2={art.y + art.height - 10} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
      </g>
    );
  } else if (object.type === 'chair') {
    shape = (
      <g transform={transform}>
        <rect x={art.x + 7} y={art.y + 9} width={art.width - 14} height={art.height - 12} rx="6" fill={tint('#eff6ff', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        <line x1={art.x + 7} y1={art.y + 8} x2={art.x + art.width - 7} y2={art.y + 8} stroke={strokeInk('#111827', colours)} strokeWidth="3" />
        <line x1={art.x + 10} y1={art.y + art.height - 2} x2={art.x + 10} y2={art.y + art.height - 8} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        <line x1={art.x + art.width - 10} y1={art.y + art.height - 2} x2={art.x + art.width - 10} y2={art.y + art.height - 8} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
      </g>
    );
  } else if (object.type === 'table') {
    shape = (
      <g transform={transform}>
        <ellipse cx={artCentreX} cy={artCentreY} rx={art.width / 2} ry={art.height / 2} fill={tint('#f1f5f9', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        <circle cx={art.x + 10} cy={artCentreY} r="5" fill={tint('#111827', colours)} />
        <circle cx={art.x + art.width - 10} cy={artCentreY} r="5" fill={tint('#111827', colours)} />
        <circle cx={artCentreX} cy={art.y + 8} r="5" fill={tint('#111827', colours)} />
        <circle cx={artCentreX} cy={art.y + art.height - 8} r="5" fill={tint('#111827', colours)} />
      </g>
    );
  } else if (object.type === 'shelf') {
    shape = (
      <g transform={transform}>
        <rect x={art.x} y={art.y} width={art.width} height={art.height} fill={tint('#fff7ed', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        {[1, 2, 3].map((line) => (
          <line
            key={line}
            x1={art.x}
            y1={art.y + (art.height / 4) * line}
            x2={art.x + art.width}
            y2={art.y + (art.height / 4) * line}
            stroke={strokeInk('#111827', colours)}
            strokeWidth="1"
          />
        ))}
      </g>
    );
  } else if (object.type === 'cabinet') {
    shape = (
      <g transform={transform}>
        <rect x={art.x} y={art.y} width={art.width} height={art.height} rx="4" fill={tint('#f8fafc', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        <line x1={artCentreX} y1={art.y} x2={artCentreX} y2={art.y + art.height} stroke={strokeInk('#111827', colours)} strokeWidth="1.5" />
        <circle cx={artCentreX - 7} cy={artCentreY} r="2" fill={tint('#111827', colours)} />
        <circle cx={artCentreX + 7} cy={artCentreY} r="2" fill={tint('#111827', colours)} />
      </g>
    );
  } else if (object.type === 'printer') {
    shape = (
      <g transform={transform}>
        <rect x={art.x + 6} y={art.y} width={art.width - 12} height="16" rx="3" fill={tint('#e5e7eb', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        <rect x={art.x} y={art.y + 14} width={art.width} height={art.height - 18} rx="5" fill={tint('#f8fafc', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        <rect x={art.x + 10} y={art.y + art.height - 12} width={art.width - 20} height="8" fill={tint('#dbeafe', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="1" />
        <circle cx={art.x + art.width - 10} cy={art.y + 24} r="2.5" fill={tint('#22c55e', colours)} />
      </g>
    );
  } else if (object.type === 'equipment') {
    shape = (
      <g transform={transform}>
        <rect x={art.x} y={art.y} width={art.width} height={art.height} rx="4" fill={tint('#e0f2fe', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        <line x1={art.x + 8} y1={art.y + 8} x2={art.x + art.width - 8} y2={art.y + art.height - 8} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        <line x1={art.x + art.width - 8} y1={art.y + 8} x2={art.x + 8} y2={art.y + art.height - 8} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
      </g>
    );
  } else if (object.type === 'whiteboard') {
    shape = (
      <g transform={transform}>
        <rect x={art.x} y={art.y} width={art.width} height={art.height} rx="3" fill={tint('#ffffff', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        <line x1={art.x + 10} y1={art.y + art.height - 8} x2={art.x + art.width - 10} y2={art.y + art.height - 8} stroke={strokeInk('#60a5fa', colours)} strokeWidth="2" />
        <line x1={art.x + 12} y1={art.y + 14} x2={art.x + art.width - 18} y2={art.y + 14} stroke={strokeInk('#d1d5db', colours)} strokeWidth="1" />
      </g>
    );
  } else if (object.type === 'sofa') {
    shape = (
      <g transform={transform}>
        <rect x={art.x + 8} y={art.y + 8} width={art.width - 16} height={art.height - 8} rx="8" fill={tint('#ede9fe', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        <rect x={art.x} y={art.y + 18} width="16" height={art.height - 18} rx="6" fill={tint('#ede9fe', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        <rect x={art.x + art.width - 16} y={art.y + 18} width="16" height={art.height - 18} rx="6" fill={tint('#ede9fe', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        <line x1={artCentreX} y1={art.y + 12} x2={artCentreX} y2={art.y + art.height - 2} stroke={strokeInk('#111827', colours)} strokeWidth="1" />
      </g>
    );
  } else if (object.type === 'plant') {
    shape = (
      <g transform={transform}>
        <rect x={art.x + 10} y={art.y + art.height - 16} width={art.width - 20} height="14" rx="3" fill={tint('#92400e', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="1.5" />
        <ellipse cx={artCentreX} cy={art.y + 16} rx={art.width / 3} ry="14" fill={tint('#86efac', colours)} stroke={strokeInk('#166534', colours)} strokeWidth="1.5" />
        <ellipse cx={art.x + 13} cy={art.y + 23} rx="11" ry="16" fill={tint('#bbf7d0', colours)} stroke={strokeInk('#166534', colours)} strokeWidth="1.2" />
        <ellipse cx={art.x + art.width - 13} cy={art.y + 23} rx="11" ry="16" fill={tint('#bbf7d0', colours)} stroke={strokeInk('#166534', colours)} strokeWidth="1.2" />
      </g>
    );
  } else if (object.type === 'waste_bin') {
    shape = (
      <g transform={transform}>
        <path d={`M ${art.x + 6} ${art.y + 10} H ${art.x + art.width - 6} L ${art.x + art.width - 10} ${art.y + art.height - 2} H ${art.x + 10} Z`} fill={tint('#fee2e2', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        <line x1={art.x + 9} y1={art.y + 5} x2={art.x + art.width - 9} y2={art.y + 5} stroke={strokeInk('#111827', colours)} strokeWidth="3" />
        <line x1={artCentreX} y1={art.y + 12} x2={artCentreX} y2={art.y + art.height - 8} stroke={strokeInk('#111827', colours)} strokeWidth="1" />
      </g>
    );
  } else if (object.type === 'pallet') {
    // Drawn as the deck boards, because that is how a pallet reads on a plan
    // and because the thing being shown is its footprint: 1.2 by 0.8 m of
    // floor that is either free or is not.
    shape = (
      <g transform={transform}>
        <rect x={art.x} y={art.y} width={art.width} height={art.height} fill={tint('#fef3c7', colours)} stroke={strokeInk('#92400e', colours)} strokeWidth="2" />
        {[0.22, 0.5, 0.78].map((along) => (
          <line
            key={along}
            x1={art.x + 4}
            y1={art.y + art.height * along}
            x2={art.x + art.width - 4}
            y2={art.y + art.height * along}
            stroke={strokeInk('#92400e', colours)}
            strokeWidth="3"
          />
        ))}
      </g>
    );
  } else if (object.type === 'racking') {
    // One bay, with its uprights: the aisle in front of it is what the drawing
    // is really about.
    shape = (
      <g transform={transform}>
        <rect x={art.x} y={art.y} width={art.width} height={art.height} fill={tint('#e5e7eb', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        {[1 / 3, 2 / 3].map((along) => (
          <line
            key={along}
            x1={art.x + art.width * along}
            y1={art.y}
            x2={art.x + art.width * along}
            y2={art.y + art.height}
            stroke={strokeInk('#111827', colours)}
            strokeWidth="2"
          />
        ))}
        <line x1={art.x} y1={art.y + art.height / 2} x2={art.x + art.width} y2={art.y + art.height / 2} stroke={strokeInk('#9ca3af', colours)} strokeWidth="1.5" />
      </g>
    );
  } else if (object.type === 'workbench') {
    shape = (
      <g transform={transform}>
        <rect x={art.x} y={art.y} width={art.width} height={art.height} rx="2" fill={tint('#f1f5f9', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        <rect x={art.x} y={art.y} width={art.width} height={art.height * 0.22} fill={tint('#cbd5e1', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="1" />
        <line x1={art.x + art.width * 0.1} y1={art.y + art.height - 4} x2={art.x + art.width * 0.9} y2={art.y + art.height - 4} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
      </g>
    );
  } else {
    shape = (
      <g transform={transform}>
        <rect x={art.x} y={art.y} width={art.width} height={art.height} rx="8" fill={tint('#ecfeff', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="2" />
        <ellipse cx={artCentreX} cy={artCentreY} rx={art.width / 3} ry={art.height / 3} fill={tint('#ffffff', colours)} stroke={strokeInk('#111827', colours)} strokeWidth="1.5" />
        <circle cx={artCentreX} cy={artCentreY} r="4" fill={tint('#60a5fa', colours)} />
      </g>
    );
  }

  return (
    <g
      key={object.id}
      className="cursor-move"
      data-testid={`five-s-object-${object.id}`}
      onPointerDown={onPointerDown}
    >
      {shape}
      {object.type !== 'wall' && (
        <g pointerEvents="none">
          {/*
            The pill behind an object's name is paper, so at night the name
            sits on the sheet rather than on a white sticker.
          */}
          <rect
            x={Math.max(0, object.x + object.width / 2 - 42)}
            y={Math.min(CANVAS_HEIGHT - 22, object.y + object.height + 5)}
            width="84"
            height="18"
            rx="9"
            fill={colours.paper}
            stroke={colours.grid}
          />
          <text
            x={object.x + object.width / 2}
            y={Math.min(CANVAS_HEIGHT - 9, object.y + object.height + 18)}
            textAnchor="middle"
            className="fill-gray-700 text-[10px] font-medium"
          >
            {objectLabel}
          </text>
        </g>
      )}
      {selected && (
        <rect
          x={object.x - 4}
          y={object.y - 4}
          width={object.width + 8}
          height={object.height + 8}
          fill="none"
          stroke="#2563eb"
          strokeDasharray="6 5"
          strokeWidth="2"
          pointerEvents="none"
        />
      )}
    </g>
  );
};
