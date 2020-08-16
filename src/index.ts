import {readMemoryValue, ADDRESS, writeMemoryValue} from './memory';
import {promptLevel} from './prompt';

/**
 * (in ms)
 */
const TICK_INTERVAL = 100;
const delayTick = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, TICK_INTERVAL));

(async () => {
  do {
    const {level, repeat} = await promptLevel();
    const forceLevel = async (level: number, repeat = false): Promise<void> => {
      const levelIndex = level - 1;

      const writeLevel = async (): Promise<void> => {
        if ((await readMemoryValue(ADDRESS.LEVEL)) !== levelIndex) {
          writeMemoryValue(ADDRESS.LEVEL, levelIndex);
          // eslint-disable-next-line no-empty
        }
      };

      if (!repeat) {
        writeLevel();
        return;
      }

      // eslint-disable-next-line no-constant-condition
      while (true) {
        await delayTick();
        try {
          await writeLevel();
        } catch {
          return;
        }
      }
    };

    await forceLevel(level, repeat);
    // eslint-disable-next-line no-constant-condition
  } while (true);
})();
