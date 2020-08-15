import inquirer from "inquirer";
import memoryjs from "memoryjs";

const upgrades = {
  SERIOUS_MODE: 0,
  MATRIX_MODE: 1,
  SHOTGUN: 2,
  HEALTHY: 3,
  UZI: 4,
  BOUNCY_BULLETS: 5,
  MORE_AMMO: 6,
  EXPLOSIVE_AMMO: 7,
  KNIFE: 8,
  FASTER_RELOAD: 9,
  LESS_SLOWDOWN: 10,
  COMPASS: 11,
};

(async () => {
  const { level, repeat } = await inquirer.prompt([
    {
      type: "input",
      name: "level",
      message: "Which level do you want to start on?",
      default: "1",
    },
    {
      type: "confirm",
      name: "repeat",
      message: "Do you want to repeat this level?",
      default: true,
    },
  ]);

  const OFFSETS = [
    {
      type: memoryjs.DOUBLE,
      offsets: {
        igtFull: [0x004b2780, 0x2c, 0x10, 0xfc, 0x100],
        igtLevel: [0x004b2780, 0x2c, 0x10, 0xfc, 0xf0],
        level: [0x004b2780, 0x2c, 0x10, 0xfc, 0x120],
        // obj_upgrade_list.player_upgrades
        currentUpgradesCounter: [0x00110614, 0x18, 0x68, 0x10, 0x84, 0x0],
      },
    },
    {
      type: memoryjs.INT,
      offsets: {},
    },
  ];

  const { handle, modBaseAddr } = memoryjs.openProcess("Post Void.exe");

  const getAddress = (pointerOffsets) => {
    const [instructionPointer, offsets, value] = [
      pointerOffsets[0],
      pointerOffsets.slice(1, pointerOffsets.length - 1),
      pointerOffsets[pointerOffsets.length - 1],
    ];

    let pointerIterator = memoryjs.readMemory(
      handle,
      modBaseAddr + instructionPointer,
      memoryjs.POINTER
    );

    for (const offset of offsets) {
      pointerIterator = memoryjs.readMemory(
        handle,
        pointerIterator + offset,
        memoryjs.POINTER
      );
    }

    return pointerIterator + value;
  };

  const readPointerOffsets = (pointerOffsets, type) => {
    return memoryjs.readMemory(handle, getAddress(pointerOffsets), type);
  };

  const readMemoryValues = () =>
    OFFSETS.map(({ type, offsets }) =>
      Object.fromEntries(
        Object.entries(offsets).map(([name, offsets]) => [
          name,
          readPointerOffsets(offsets, type),
        ])
      )
    );
  // console.log(readMemoryValues());

  const writeMemoryValue = (pointerOffsets, value, type) => {
    return memoryjs.writeMemory(
      handle,
      getAddress(pointerOffsets),
      value,
      type
    );
  };

  const forceLevel = () => {
    const levelIndex = Number(level) - 1;
    const writeLevel = () => {
      if (readMemoryValues().level !== levelIndex) {
        writeMemoryValue(OFFSETS.level, levelIndex, memoryjs.DOUBLE);
      }
    };

    if (!repeat) {
      writeLevel();
      return;
    }

    setInterval(() => writeLevel, 100);
  };

  forceLevel();

  // setInterval(() => console.log(readMemoryValues()), 500);
})();
