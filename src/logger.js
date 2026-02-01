import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

class Logger {
  constructor({
    logLevel = LogLevel.INFO,
    enableFileLogging = true,
    logDir = null,
    maxFileSize = 10 * 1024 * 1024,
    maxFiles = 5,
    enableConsole = true
  } = {}) {
    this.logLevel = logLevel;
    this.enableFileLogging = enableFileLogging;
    this.logDir = logDir || path.join(__dirname, '..', 'logs');
    this.maxFileSize = maxFileSize;
    this.maxFiles = maxFiles;
    this.enableConsole = enableConsole;
    
    this.logLevelPriority = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 1,
      [LogLevel.WARN]: 2,
      [LogLevel.ERROR]: 3
    };
  }

  async ensureLogDir() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error('[Logger] Failed to create log directory:', error.message);
    }
  }

  _formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  _shouldLog(level) {
    const currentPriority = this.logLevelPriority[level];
    const minPriority = this.logLevelPriority[this.logLevel];
    return currentPriority >= minPriority;
  }

  async _writeToFile(message) {
    if (!this.enableFileLogging) {
      return;
    }

    await this.ensureLogDir();
    
    const date = new Date().toISOString().split('T')[0];
    const logFile = path.join(this.logDir, `${date}.log`);

    try {
      await fs.appendFile(logFile, message + '\n');
      await this._rotateLogFile(logFile);
    } catch (error) {
      console.error('[Logger] Failed to write to log file:', error.message);
    }
  }

  async _rotateLogFile(logFile) {
    try {
      const stats = await fs.stat(logFile);
      if (stats.size > this.maxFileSize) {
        const timestamp = new Date().getTime();
        const archiveFile = logFile.replace('.log', `.${timestamp}.log`);
        await fs.rename(logFile, archiveFile);
        
        await this._cleanupOldLogs();
      }
    } catch (error) {
      console.error('[Logger] Failed to rotate log file:', error.message);
    }
  }

  async _cleanupOldLogs() {
    try {
      const files = await fs.readdir(this.logDir);
      const logFiles = files
        .filter(f => f.endsWith('.log'))
        .map(f => ({
          name: f,
          path: path.join(this.logDir, f),
          time: 0
        }));

      for (const file of logFiles) {
        try {
          const stats = await fs.stat(file.path);
          file.time = stats.mtimeMs;
        } catch (error) {
          file.time = 0;
        }
      }

      logFiles.sort((a, b) => b.time - a.time);
      
      const filesToDelete = logFiles.slice(this.maxFiles);
      for (const file of filesToDelete) {
        try {
          await fs.unlink(file.path);
        } catch (error) {
          console.error(`[Logger] Failed to delete old log file ${file.name}:`, error.message);
        }
      }
    } catch (error) {
      console.error('[Logger] Failed to cleanup old logs:', error.message);
    }
  }

  log(level, message, meta = {}) {
    if (!this._shouldLog(level)) {
      return;
    }

    const formattedMessage = this._formatMessage(level, message, meta);

    if (this.enableConsole) {
      const consoleMethod = level === LogLevel.ERROR ? console.error :
                           level === LogLevel.WARN ? console.warn :
                           level === LogLevel.DEBUG ? console.debug :
                           console.log;
      consoleMethod(formattedMessage);
    }

    this._writeToFile(formattedMessage);
  }

  debug(message, meta = {}) {
    this.log(LogLevel.DEBUG, message, meta);
  }

  info(message, meta = {}) {
    this.log(LogLevel.INFO, message, meta);
  }

  warn(message, meta = {}) {
    this.log(LogLevel.WARN, message, meta);
  }

  error(message, meta = {}) {
    this.log(LogLevel.ERROR, message, meta);
  }
}

const defaultLogger = new Logger({
  logLevel: process.env.DEBUG === 'true' ? LogLevel.DEBUG : LogLevel.INFO,
  enableFileLogging: true,
  enableConsole: true
});

export { Logger, LogLevel, defaultLogger };
export default defaultLogger;
