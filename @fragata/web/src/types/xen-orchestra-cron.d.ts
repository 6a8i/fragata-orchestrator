declare module '@fragata/cron' {
  export function createSchedule(
    pattern: string,
    zone?: string
  ): {
    next(n: number): Date[]
  }
}
