import dayjs from 'dayjs'

export const formatDate = (date: string | number | Date, format: string = 'YYYY-MM-DD HH:mm:ss') => {
  return dayjs(date).format(format)
}

export const debounce = <T extends (...args: any[]) => any>(fn: T, delay: number = 300) => {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export const throttle = <T extends (...args: any[]) => any>(fn: T, delay: number = 300) => {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (!timer) {
      timer = setTimeout(() => {
        fn(...args)
        timer = null
      }, delay)
    }
  }
}
