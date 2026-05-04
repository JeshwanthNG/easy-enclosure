import { booleans } from '@jscad/modeling';
import { Params } from '../params';

import { holes } from './holes';
import { flanges } from './wallmount';
import {
  clover,
  ellipseBody,
  hollowEllipse,
  hollowRoundCube,
  roundedCube,
} from './utils';
import { waterProofSealCutout } from './waterproofseal';
import { screws, screwPillars } from './screws';
import { translate } from '@jscad/modeling/src/operations/transforms';

const { subtract, union } = booleans;

export const base = (params: Params) => {
  const {
    baseShape,
    length,
    width,
    height,
    wall,
    floor,
    cornerRadius,
    insertThickness,
    insertClearance,
    lidScrewDiameter,
    baseLidScrewDiameter,
    lidScrewCount,
  } = params;

  const body = [];
  const subtracts = [];

  let _wall = wall;
  if (params.waterProof) {
    _wall = wall * 2 + insertClearance * 2 + insertThickness;
  }

  const diameterMax = Math.max(baseLidScrewDiameter, lidScrewDiameter);
  const screwOffset = diameterMax / 2 + cornerRadius / 4 + wall / 2;

  if (baseShape === 'rectangle') {
    if (params.lidScrews) {
      body.push(
        subtract(
          roundedCube(width, length, height, cornerRadius),
          translate(
            [_wall, _wall, floor],
            clover(width - _wall * 2, length - _wall * 2, height, screwOffset),
          ),
        ),
      );
      subtracts.push(screws(baseShape, width, length, height, screwOffset, baseLidScrewDiameter));
    } else {
      body.push(hollowRoundCube(width, length, height, _wall, cornerRadius));
    }
  } else {
    body.push(
      subtract(
        ellipseBody(width, length, height),
        translate(
          [_wall, _wall, floor],
          ellipseBody(width - _wall * 2, length - _wall * 2, height),
        ),
      ),
    );
    if (params.lidScrews) {
      const pillars = screwPillars(
        baseShape,
        width,
        length,
        height,
        screwOffset,
        lidScrewCount,
      );
      if (pillars) {
        body.push(pillars);
      }
      subtracts.push(
        screws(baseShape, width, length, height, screwOffset, baseLidScrewDiameter, lidScrewCount),
      );
    }
  }

  if (params.wallMounts) {
    body.push(flanges(params));
  }

  if (params.waterProof) {
    subtracts.push(waterProofSealCutout(params));
  }

  const baseHoles = params.holes.filter((v) => {
    if (v.mode === 'angular') {
      return true;
    }
    return ['front', 'back', 'left', 'right', 'bottom'].includes(v.surface);
  });

  if (baseHoles.length > 0) {
    subtracts.push(holes(params));
  }

  if (subtracts.length > 0) {
    return subtract(union(body), union(subtracts));
  } else {
    return union(body);
  }
};
