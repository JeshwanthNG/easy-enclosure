import { rotate, translate } from '@jscad/modeling/src/operations/transforms';
import { degToRad } from '@jscad/modeling/src/utils';
import { cuboid, cylinder, roundedRectangle } from '@jscad/modeling/src/primitives';
import { extrudeLinear } from '@jscad/modeling/src/operations/extrusions';
import { union } from '@jscad/modeling/src/operations/booleans';

import { Params, Hole } from '../params';
import { Geom3 } from '@jscad/modeling/src/geometries/types';
import { Vec3 } from '@jscad/modeling/src/maths/types';
import { Surface } from '.';

const buildHoleShape = (hole: Hole, depth: number): Geom3 => {
  if (hole.shape === 'square') {
    return cuboid({ size: [hole.width, hole.width, depth] });
  }
  if (hole.shape === 'rectangle') {
    return cuboid({ size: [hole.width, hole.length, depth] });
  }
  if (hole.shape === 'circle') {
    return cylinder({ radius: hole.diameter / 2, height: depth });
  }
  if (hole.shape === 'rounded-rectangle') {
    const maxRadius = Math.min(hole.width, hole.length) / 2;
    const radius = Math.max(0.01, Math.min(hole.cornerRadius, maxRadius - 0.001));
    return translate(
      [0, 0, -depth / 2],
      extrudeLinear(
        { height: depth },
        roundedRectangle({
          size: [hole.width, hole.length],
          roundRadius: radius,
        }),
      ),
    );
  }
  throw new Error(`Unknown hole shape: ${(hole as Hole).shape}`);
};

const placeAngularHole = (hole: Hole, params: Params): Geom3 => {
  const { length, width, height, wall, insertThickness, insertClearance } = params;
  const totalWallThickness = insertThickness + insertClearance * 2 + wall * 2;
  const cutDepth = totalWallThickness * 3;

  const t = degToRad(hole.angle);
  const a = width / 2 - totalWallThickness / 2;
  const b = length / 2 - totalWallThickness / 2;
  const x = width / 2 + a * Math.cos(t);
  const y = length / 2 + b * Math.sin(t);
  const z = height / 2 + hole.verticalOffset;

  const rot: Vec3 =
    hole.shape === 'circle'
      ? [0, degToRad(90), t]
      : [degToRad(90), 0, degToRad(90) + t];

  return translate([x, y, z], rotate(rot, buildHoleShape(hole, cutDepth)));
};

const placeFaceHole = (hole: Hole, params: Params): Geom3 | null => {
  const { length, width, height, wall, insertThickness, insertClearance } = params;
  const totalWallThickness = insertThickness + insertClearance * 2 + wall * 2;

  let x: number;
  let y: number;
  let z: number;
  let rot: Vec3;

  if (hole.surface === 'front') {
    y = length - totalWallThickness / 2;
    x = width / 2 - hole.y;
    z = height / 2 + hole.x;
    rot = [degToRad(90), 0, 0];
  } else if (hole.surface === 'right') {
    x = totalWallThickness / 2;
    y = length / 2 - hole.y;
    z = height / 2 + hole.x;
    if (hole.shape === 'circle') {
      rot = [0, degToRad(90), 0];
    } else {
      rot = [degToRad(90), 0, degToRad(90)];
    }
  } else if (hole.surface === 'back') {
    y = totalWallThickness / 2;
    x = width / 2 - hole.y;
    z = height / 2 + hole.x;
    rot = [degToRad(90), 0, 0];
  } else if (hole.surface === 'left') {
    x = width - totalWallThickness / 2;
    y = length / 2 - hole.y;
    z = height / 2 + hole.x;
    if (hole.shape === 'circle') {
      rot = [0, degToRad(90), 0];
    } else {
      rot = [degToRad(90), 0, degToRad(90)];
    }
  } else if (hole.surface === 'bottom' || hole.surface === 'top') {
    y = length / 2 - hole.x;
    x = width / 2 - hole.y;
    z = 0;
    rot = [0, 0, 0];
  } else {
    return null;
  }

  return translate([x, y, z], rotate(rot, buildHoleShape(hole, totalWallThickness)));
};

export const holes = (
  params: Params,
  surfacesFilter: Surface[] = ['bottom', 'left', 'right', 'back', 'front'],
) => {
  const includeAngular = ['front', 'back', 'left', 'right'].some((s) =>
    surfacesFilter.includes(s as Surface),
  );

  const result: Geom3[] = [];

  params.holes.forEach((hole) => {
    if (hole.mode === 'angular') {
      if (!includeAngular) {
        return;
      }
      result.push(placeAngularHole(hole, params));
      return;
    }
    if (!surfacesFilter.includes(hole.surface)) {
      return;
    }
    const geom = placeFaceHole(hole, params);
    if (geom) {
      result.push(geom);
    }
  });

  return union(result);
};
