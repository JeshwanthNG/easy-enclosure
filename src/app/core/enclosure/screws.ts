import { Geom3 } from '@jscad/modeling/src/geometries/types';
import { union } from '@jscad/modeling/src/operations/booleans';
import { cylinder } from '@jscad/modeling/src/primitives';
import { translate } from '@jscad/modeling/src/operations/transforms';
import { degToRad } from '@jscad/modeling/src/utils';

import { BaseShape } from '../params';

export const angularStartDeg = (count: number): number => 360 / (count * 2);

export const screwAngularPositions = (
  width: number,
  length: number,
  offset: number,
  count: number,
): { x: number; y: number; t: number }[] => {
  const a = width / 2 - offset;
  const b = length / 2 - offset;
  const start = angularStartDeg(count);
  const positions: { x: number; y: number; t: number }[] = [];
  for (let i = 0; i < count; i++) {
    const t = degToRad(start + (360 / count) * i);
    positions.push({
      x: width / 2 + a * Math.cos(t),
      y: length / 2 + b * Math.sin(t),
      t,
    });
  }
  return positions;
};

export const screws = (
  baseShape: BaseShape,
  width: number,
  length: number,
  height: number,
  offset: number,
  diameter: number,
  count: number = 4,
): Geom3 => {
  if (baseShape === 'rectangle') {
    return union(
      translate(
        [offset, offset, height / 2],
        cylinder({ radius: diameter / 2, height: height }),
      ),
      translate(
        [width - offset, offset, height / 2],
        cylinder({ radius: diameter / 2, height: height }),
      ),
      translate(
        [offset, length - offset, height / 2],
        cylinder({ radius: diameter / 2, height: height }),
      ),
      translate(
        [width - offset, length - offset, height / 2],
        cylinder({ radius: diameter / 2, height: height }),
      ),
    );
  }

  const positions = screwAngularPositions(width, length, offset, count);
  return union(
    positions.map((p) =>
      translate([p.x, p.y, height / 2], cylinder({ radius: diameter / 2, height: height })),
    ),
  );
};

export const screwPillars = (
  baseShape: BaseShape,
  width: number,
  length: number,
  height: number,
  pillarRadius: number,
  count: number,
): Geom3 | null => {
  if (baseShape === 'rectangle') {
    return null;
  }
  const positions = screwAngularPositions(width, length, pillarRadius, count);
  return union(
    positions.map((p) =>
      translate([p.x, p.y, height / 2], cylinder({ radius: pillarRadius, height: height })),
    ),
  );
};
