import { booleans, transforms } from '@jscad/modeling';
import {
  cloverFrame,
  ellipseBody,
  ellipseFrame,
  roundedCube,
  roundedFrame,
} from './utils';

import { Params } from '../params';
import { screws, screwPillars } from './screws';
import { subtract } from '@jscad/modeling/src/operations/booleans';
import { holes } from './holes';

const { union } = booleans;
const { translate } = transforms;

export const lid = (params: Params) => {
  const {
    baseShape,
    length,
    width,
    wall,
    roof,
    cornerRadius,
    insertThickness,
    insertHeight,
    insertClearance,
    baseLidScrewDiameter,
    lidScrewDiameter,
    lidScrewCount,
  } = params;

  const entities = [];
  const subtracts = [];

  const diameterMax = Math.max(baseLidScrewDiameter, lidScrewDiameter);
  const screwOffset = diameterMax / 2 + cornerRadius / 4 + wall / 2;

  if (baseShape === 'rectangle') {
    entities.push(roundedCube(width, length, roof, cornerRadius));

    if (params.lidScrews) {
      entities.push(
        translate(
          [wall + insertClearance, wall + insertClearance, roof],
          cloverFrame(
            width - wall * 2 - insertClearance * 2,
            length - wall * 2 - insertClearance * 2,
            insertHeight,
            insertThickness,
            screwOffset,
          ),
        ),
      );
      subtracts.push(screws(baseShape, width, length, roof * 2, screwOffset, lidScrewDiameter));
    } else {
      entities.push(
        translate(
          [wall + insertClearance, wall + insertClearance, roof],
          roundedFrame(
            width - wall * 2 - insertClearance * 2,
            length - wall * 2 - insertClearance * 2,
            insertHeight,
            insertThickness,
            cornerRadius,
          ),
        ),
      );
    }
  } else {
    entities.push(ellipseBody(width, length, roof));

    entities.push(
      translate(
        [wall + insertClearance, wall + insertClearance, roof],
        ellipseFrame(
          width - wall * 2 - insertClearance * 2,
          length - wall * 2 - insertClearance * 2,
          insertHeight,
          insertThickness,
        ),
      ),
    );

    if (params.lidScrews) {
      const pillars = screwPillars(
        baseShape,
        width,
        length,
        roof + insertHeight,
        screwOffset,
        lidScrewCount,
      );
      if (pillars) {
        entities.push(translate([0, 0, 0], pillars));
      }
      subtracts.push(
        screws(
          baseShape,
          width,
          length,
          (roof + insertHeight) * 2,
          screwOffset,
          lidScrewDiameter,
          lidScrewCount,
        ),
      );
    }
  }

  const holeCount = params.holes.filter((v) => {
    return v.mode !== 'angular' && v.surface === 'top';
  }).length;

  if (holeCount > 0) {
    subtracts.push(holes(params, ['top']));
  }

  if (subtracts.length > 0) {
    return subtract(union(entities), union(subtracts));
  } else {
    return union(entities);
  }
};
