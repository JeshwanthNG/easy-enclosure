import { Geom3 } from '@jscad/modeling/src/geometries/types';
import { subtract, union } from '@jscad/modeling/src/operations/booleans';
import { rotateX, rotateY, translate } from '@jscad/modeling/src/operations/transforms';
import { cuboid, cylinder } from '@jscad/modeling/src/primitives';
import { degToRad } from '@jscad/modeling/src/utils';
import { Surface } from '.';
import { Params, PCBMount } from '../params';

const DEFAULT_SOCKET_WIDTH = 26;
const DEFAULT_SOCKET_LENGTH = 42;
const DEFAULT_SOCKET_WALL = 1.6;

const mountType = (mountParams: PCBMount): 'standoff' | 'oled-lcd-socket' => {
  return mountParams.mountType ?? 'standoff';
};

const pcbStandoff = (mountParams: PCBMount): Geom3 => {
  return subtract(
    cylinder({
      height: mountParams.height,
      radius: mountParams.outerDiameter / 2,
      segments: 20,
    }),
    cylinder({
      height: mountParams.height,
      radius: mountParams.screwDiameter / 2,
      segments: 20,
    }),
  );
};

const oledLcdSocket = (mountParams: PCBMount): Geom3 => {
  const width = Math.max(1, mountParams.socketWidth ?? DEFAULT_SOCKET_WIDTH);
  const length = Math.max(1, mountParams.socketLength ?? DEFAULT_SOCKET_LENGTH);
  const wall = Math.max(0.4, mountParams.socketWall ?? DEFAULT_SOCKET_WALL);
  const height = Math.max(0.8, mountParams.height);

  const outer = cuboid({ size: [width, length, height] });
  const innerWidth = width - wall * 2;
  const innerLength = length - wall * 2;

  if (innerWidth <= 0.2 || innerLength <= 0.2) {
    return outer;
  }

  const inner = cuboid({ size: [innerWidth, innerLength, height + 0.4] });
  return subtract(outer, inner);
};

export const pcbMount = (mountParams: PCBMount): Geom3 => {
  if (mountType(mountParams) === 'oled-lcd-socket') {
    return oledLcdSocket(mountParams);
  }
  return pcbStandoff(mountParams);
};

const placeBaseMount = (mount: PCBMount, params: Params): Geom3 => {
  const { length, width, height, floor, wall, waterProof, insertThickness, insertClearance } =
    params;
  const surface: Surface = mount.surface ?? 'bottom';
  const mountBody = pcbMount(mount);
  const innerWall = waterProof ? wall * 2 + insertClearance * 2 + insertThickness : wall;
  const baseFloor = params.lidScrews ? floor : innerWall;
  const bottomX = width / 2 - mount.x;
  const bottomY = length / 2 - mount.y;
  const wallX = width / 2 - mount.x;
  const wallY = length / 2 - mount.x;
  const wallZ = height / 2 + mount.y;

  if (surface === 'bottom') {
    return translate([bottomX, bottomY, baseFloor + mount.height / 2], mountBody);
  }

  if (surface === 'front') {
    return translate(
      [wallX, length - innerWall - mount.height / 2, wallZ],
      rotateX(degToRad(-90), mountBody),
    );
  }

  if (surface === 'back') {
    return translate(
      [wallX, innerWall + mount.height / 2, wallZ],
      rotateX(degToRad(90), mountBody),
    );
  }

  if (surface === 'right') {
    return translate(
      [innerWall + mount.height / 2, wallY, wallZ],
      rotateY(degToRad(-90), mountBody),
    );
  }

  return translate(
    [width - innerWall - mount.height / 2, wallY, wallZ],
    rotateY(degToRad(90), mountBody),
  );
};

const placeLidMount = (mount: PCBMount, params: Params): Geom3 => {
  const { length, width, roof } = params;
  return translate(
    [width / 2 - mount.x, length / 2 - mount.y, roof + mount.height / 2],
    pcbMount(mount),
  );
};

const buildMountUnion = (mounts: Geom3[]): Geom3 | null => {
  if (mounts.length === 0) {
    return null;
  }

  return mounts.length === 1 ? mounts[0] : union(mounts);
};

export const pcbMountsOnBase = (params: Params): Geom3 | null => {
  const mounts = params.pcbMounts
    .filter((mount) => (mount.surface ?? 'bottom') !== 'top')
    .map((mount) => placeBaseMount(mount, params));

  return buildMountUnion(mounts);
};

export const pcbMountsOnLid = (params: Params): Geom3 | null => {
  const mounts = params.pcbMounts
    .filter((mount) => (mount.surface ?? 'bottom') === 'top')
    .map((mount) => placeLidMount(mount, params));

  return buildMountUnion(mounts);
};

export const pcbMounts = (params: Params): Geom3 | null => {
  const baseMounts = pcbMountsOnBase(params);
  const lidMounts = pcbMountsOnLid(params);
  const mounts = [baseMounts, lidMounts].filter((item): item is Geom3 => item !== null);

  if (mounts.length === 0) {
    return null;
  }

  return mounts.length === 1 ? mounts[0] : union(mounts);
};
