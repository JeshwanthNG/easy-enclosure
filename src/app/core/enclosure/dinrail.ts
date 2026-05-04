import { Geom3 } from '@jscad/modeling/src/geometries/types';
import { subtract } from '@jscad/modeling/src/operations/booleans';
import { rotateZ, translate } from '@jscad/modeling/src/operations/transforms';
import { cuboid } from '@jscad/modeling/src/primitives';
import { degToRad } from '@jscad/modeling/src/utils';

import { Params } from '../params';

const RAIL_WIDTH = 35;
const RAIL_DEPTH = 7.5;
const SLOT_CLEARANCE = 0.5;

const SLIDE_SIDE_WALL = 5;
const SLIDE_TOP_WALL = 3;
const SLIDE_BOTTOM_WALL = 3;

const SNAP_SIDE_WALL = 3;
const SNAP_TOP_WALL = 2;
const SNAP_LIP_HEIGHT = 2;
const SNAP_LIP_OVERHANG = 1.75;

const slideBlockHeight = (): number =>
  RAIL_DEPTH + SLOT_CLEARANCE + SLIDE_TOP_WALL + SLIDE_BOTTOM_WALL;

const snapBlockHeight = (): number =>
  SNAP_TOP_WALL + RAIL_DEPTH + SLOT_CLEARANCE + SNAP_LIP_HEIGHT;

const buildSlideMount = (params: Params): Geom3 => {
  const { dinRailMountLength } = params;
  const slotWidth = RAIL_WIDTH + SLOT_CLEARANCE * 2;
  const slotHeight = RAIL_DEPTH + SLOT_CLEARANCE;
  const blockWidth = slotWidth + SLIDE_SIDE_WALL * 2;
  const blockHeight = slideBlockHeight();
  const blockLength = dinRailMountLength;

  const block = cuboid({ size: [blockLength, blockWidth, blockHeight] });
  const slot = cuboid({
    size: [blockLength + 1, slotWidth, slotHeight],
    center: [0, 0, (SLIDE_BOTTOM_WALL - SLIDE_TOP_WALL) / 2],
  });

  return subtract(block, slot);
};

const buildSnapMount = (params: Params): Geom3 => {
  const { dinRailMountLength } = params;
  const cavityWidth = RAIL_WIDTH + SLOT_CLEARANCE * 2;
  const cavityHeight = RAIL_DEPTH + SLOT_CLEARANCE;
  const lipGap = cavityWidth - SNAP_LIP_OVERHANG * 2;
  const blockWidth = cavityWidth + SNAP_SIDE_WALL * 2;
  const blockHeight = snapBlockHeight();
  const blockLength = dinRailMountLength;

  const block = cuboid({ size: [blockLength, blockWidth, blockHeight] });

  const cavityCenterZ = blockHeight / 2 - SNAP_TOP_WALL - cavityHeight / 2;
  const cavity = cuboid({
    size: [blockLength + 1, cavityWidth, cavityHeight + 0.01],
    center: [0, 0, cavityCenterZ],
  });

  const lipCenterZ = -blockHeight / 2 + SNAP_LIP_HEIGHT / 2;
  const lipGapCut = cuboid({
    size: [blockLength + 1, lipGap, SNAP_LIP_HEIGHT + 0.01],
    center: [0, 0, lipCenterZ],
  });

  return subtract(block, cavity, lipGapCut);
};

export const dinRailMount = (params: Params): Geom3 => {
  const { width, length, dinRailMountOrientation, dinRailMountStyle } = params;

  let mount: Geom3 =
    dinRailMountStyle === 'snap' ? buildSnapMount(params) : buildSlideMount(params);

  const blockHeight =
    dinRailMountStyle === 'snap' ? snapBlockHeight() : slideBlockHeight();

  if (dinRailMountOrientation === 'y') {
    mount = rotateZ(degToRad(90), mount);
  }

  return translate([width / 2, length / 2, -blockHeight / 2], mount);
};
