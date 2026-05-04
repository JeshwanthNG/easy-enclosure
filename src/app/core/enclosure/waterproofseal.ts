import { subtract } from '@jscad/modeling/src/operations/booleans';
import { translate } from '@jscad/modeling/src/operations/transforms';

import { Params } from '../params';

import { cloverFrame, ellipseFrame } from './utils';
import { screwPillars } from './screws';

export const waterProofSealCutout = (params: Params) => {
  const {
    baseShape,
    length,
    width,
    height,
    wall,
    insertThickness,
    insertHeight,
    sealThickness,
    insertClearance,
    cornerRadius,
    baseLidScrewDiameter,
    lidScrewDiameter,
    lidScrewCount,
  } = params;

  const diameterMax = Math.max(baseLidScrewDiameter, lidScrewDiameter);
  const screwOffset = diameterMax / 2 + cornerRadius / 4 + wall / 2;
  const grooveHeight = insertHeight + sealThickness + insertClearance;
  const grooveThickness = insertThickness + insertClearance * 2;
  const groove_z = height - (insertHeight + sealThickness);

  if (baseShape === 'rectangle') {
    return translate(
      [wall, wall, groove_z],
      cloverFrame(
        width - wall * 2,
        length - wall * 2,
        grooveHeight,
        grooveThickness,
        screwOffset,
      ),
    );
  }

  const cutout = translate(
    [wall, wall, groove_z],
    ellipseFrame(width - wall * 2, length - wall * 2, grooveHeight, grooveThickness),
  );

  if (params.lidScrews) {
    const postExclusions = screwPillars(
      baseShape,
      width,
      length,
      grooveHeight,
      screwOffset,
      lidScrewCount,
    );
    if (postExclusions) {
      return subtract(cutout, translate([0, 0, groove_z], postExclusions));
    }
  }
  return cutout;
};

export const waterProofSeal = (params: Params) => {
  const {
    baseShape,
    length,
    width,
    wall,
    baseLidScrewDiameter,
    sealThickness,
    insertThickness,
    insertClearance,
    cornerRadius,
    lidScrewDiameter,
  } = params;
  const diameterMax = Math.max(baseLidScrewDiameter, lidScrewDiameter);
  const screwOffset = diameterMax / 2 + cornerRadius / 4 + wall / 2;

  if (baseShape === 'rectangle') {
    return cloverFrame(
      width - wall * 2 - insertClearance * 2,
      length - wall * 2 - insertClearance * 2,
      sealThickness,
      insertThickness,
      screwOffset,
    );
  }

  return ellipseFrame(
    width - wall * 2 - insertClearance * 2,
    length - wall * 2 - insertClearance * 2,
    sealThickness,
    insertThickness,
  );
};
