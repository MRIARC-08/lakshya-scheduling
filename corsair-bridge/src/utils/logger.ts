type LogLevel = 'INFO' | 'ERROR' | 'WARN' | 'SUCCESS'

export function log(level: LogLevel, message: string, data?: unknown): void {
  const timestamp = new Date().toISOString()
  const emoji = {
    INFO: '📘',
    ERROR: '❌',
    WARN: '⚠️',
    SUCCESS: '✅',
  }[level]

  console.log(`${emoji} [${timestamp}] [${level}] ${message}`)
  if (data) {
    console.log(JSON.stringify(data, null, 2))
  }
}
