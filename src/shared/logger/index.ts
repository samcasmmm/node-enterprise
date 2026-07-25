import chalk from 'chalk';

type LogLevel = 'success' | 'info' | 'warn' | 'error';

const getTimestamp = (): string => chalk.gray(new Date().toLocaleTimeString());

const formatLevelTag = (level: LogLevel): string => {
  switch (level) {
    case 'success':
      return chalk.black.bgGreen(' SUCCESS ');
    case 'info':
      return chalk.black.bgBlue(' INFO ');
    case 'warn':
      return chalk.black.bgYellow(' WARN ');
    case 'error':
      return chalk.white.bgRed(' ERROR ');
  }
};

const writeLog = (level: LogLevel, message: string, meta?: unknown) => {
  const output = `${getTimestamp()} ${formatLevelTag(level)} ${message}`;

  if (level === 'error') {
    console.error(output, meta ?? '');
  } else {
    console.log(output, meta ?? '');
  }
};

export const logger = {
  success: (message: string, meta?: unknown) => writeLog('success', message, meta),

  info: (message: string, meta?: unknown) => writeLog('info', message, meta),

  warn: (message: string, meta?: unknown) => writeLog('warn', message, meta),

  error: (message: string, meta?: unknown) => writeLog('error', message, meta),

  banner: (title: string) => {
    const padding = 6;
    const width = title.length + padding;

    const top = `╔${'═'.repeat(width)}╗`;
    const middle = `║${title.padStart((width + title.length) / 2).padEnd(width)}║`;
    const bottom = `╚${'═'.repeat(width)}╝`;

    console.log(chalk.bold.cyan(top));
    console.log(chalk.bold.white.bgCyan(middle));
    console.log(chalk.bold.cyan(bottom));
    console.log();
  },
};
