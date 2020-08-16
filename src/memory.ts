// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import memoryjs from 'memoryjs';
import {promisify} from 'util';

export enum upgrades {
  SERIOUS_MODE,
  MATRIX_MODE,
  SHOTGUN,
  HEALTHY,
  UZI,
  BOUNCY_BULLETS,
  MORE_AMMO,
  EXPLOSIVE_AMMO,
  KNIFE,
  FASTER_RELOAD,
  LESS_SLOWDOWN,
  COMPASS,
}

export interface MemoryLocation {
  offsets: number[];
  /** @default memoryjs.DOUBLE */
  type?: number;
}

export enum ADDRESS {
  IGT_FULL = 'IGT_FULL',
  IGT_LEVEL = 'IGT_LEVEL',
  LEVEL = 'LEVEL',
  CURRENT_UPGRADES_COUNTER = 'CURRENT_UPGRADES_COUNTER',
}
const ADDRESS_KEYS = Object.keys(ADDRESS) as ADDRESS[];

const MEMORY_LOCATIONS: {[key in ADDRESS]: MemoryLocation} = {
  [ADDRESS.IGT_FULL]: {offsets: [0x004b2780, 0x2c, 0x10, 0xfc, 0x100]},
  [ADDRESS.IGT_LEVEL]: {offsets: [0x004b2780, 0x2c, 0x10, 0xfc, 0xf0]},
  [ADDRESS.LEVEL]: {offsets: [0x004b2780, 0x2c, 0x10, 0xfc, 0x120]},
  // obj_upgrade_list.player_upgrades
  [ADDRESS.CURRENT_UPGRADES_COUNTER]: {
    offsets: [0x00110614, 0x18, 0x68, 0x10, 0x84, 0x0],
  },
};

interface Process {
  dwSize: number;
  th32ProcessID: number;
  cntThreads: number;
  th32ParentProcessID: number;
  pcPriClassBase: number;
  szExeFile: string;
  modBaseAddr: number;
  handle: number;
}

const openProcess = promisify(memoryjs.openProcess);

let _process: Process;
const getProcess = async (): Promise<Process> => {
  if (!_process) {
    try {
      _process = await openProcess('Post Void.exe');
    } catch (err) {
      console.error(
        'Could not find Post Void process. Start the game, and try again',
      );
    }
  }

  return _process;
};

const getAddress = async (pointerOffsets: number[]): Promise<number> => {
  const [instructionPointer, offsets, value] = [
    pointerOffsets[0],
    pointerOffsets.slice(1, pointerOffsets.length - 1),
    pointerOffsets[pointerOffsets.length - 1],
  ];

  const {handle, modBaseAddr} = await getProcess();

  let pointerIterator = memoryjs.readMemory(
    handle,
    modBaseAddr + instructionPointer,
    memoryjs.POINTER,
  );

  if (process.env.DEBUG) {
    console.log(
      `[${modBaseAddr.toString(16)}+${instructionPointer.toString(
        16,
      )}] = ${pointerIterator.toString(16)}`,
    );
  }

  for (const offset of offsets) {
    if (process.env.DEBUG) {
      console.log(`[${pointerIterator.toString(16)}+${offset.toString(16)}]`);
    }

    pointerIterator = memoryjs.readMemory(
      handle,
      pointerIterator + offset,
      memoryjs.POINTER,
    );
  }

  if (process.env.DEBUG) {
    console.log(
      `[${pointerIterator.toString(16)}+${value.toString(16)}]`,
      `= ${(pointerIterator + value).toString(16)}`,
    );
  }

  return pointerIterator + value;
};

export const readMemory = async (address: ADDRESS): Promise<number> => {
  const {handle} = await getProcess();
  return memoryjs.readMemory(
    handle,
    await getAddress(MEMORY_LOCATIONS[address].offsets),
    getMemoryType(address),
  );
};

const getMemoryType = (address: ADDRESS): number =>
  MEMORY_LOCATIONS[address].type || memoryjs.DOUBLE;

export const readMemoryValue = (address: ADDRESS): Promise<number> =>
  readMemory(address);

export const readMemoryValues = async (): Promise<{[key in ADDRESS]: number}> =>
  Object.fromEntries(
    await Promise.all(
      ADDRESS_KEYS.map(async (address) => [address, await readMemory(address)]),
    ),
  );

export const writeMemoryValue = async (
  address: ADDRESS,
  value: number | string,
): Promise<void> => {
  const {handle} = await getProcess();
  memoryjs.writeMemory(
    handle,
    await getAddress(MEMORY_LOCATIONS[address].offsets),
    value,
    getMemoryType(address),
  );
};
