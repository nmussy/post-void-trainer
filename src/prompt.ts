import inquirer from 'inquirer';

export const promptLevel = (): Promise<{level: number; repeat: boolean}> => {
  console.log();
  return inquirer.prompt([
    {
      type: 'number',
      name: 'level',
      message: 'Which level do you want to start on?',
      default: 1,
      validate: (level: number) => (level > 0 && level < 12) || level === 100,
      // transformer: (level: number) => level - 1,
    },
    {
      type: 'confirm',
      name: 'repeat',
      message: 'Do you want to repeat this level?',
      default: false,
    },
  ]);
};
