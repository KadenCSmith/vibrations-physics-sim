import { useCallback, useEffect, useRef, useState } from 'react'

/** The clock only selects a point on the analytical trajectory. */
export function useSimulationClock(duration: number) {
  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const timeRef = useRef(0)
  const seek = useCallback((next: number) => {
    const value = Math.min(duration, Math.max(0, next))
    timeRef.current = value
    setTime(value)
  }, [duration])
  const reset = useCallback(() => { timeRef.current = 0; setTime(0) }, [])
  useEffect(() => {
    if (!playing) return
    let handle = 0, previous = performance.now(), lastPaint = previous
    const frame = (now: number) => {
      const dt = Math.min((now - previous) / 1000, .1)
      previous = now
      timeRef.current = (timeRef.current + dt * speed) % duration
      if (now - lastPaint > 1000 / 30) { setTime(timeRef.current); lastPaint = now }
      handle = requestAnimationFrame(frame)
    }
    handle = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(handle)
  }, [playing, speed, duration])
  return { time, playing, speed, setPlaying, setSpeed, seek, reset }
}
