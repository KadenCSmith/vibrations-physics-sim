import { useCallback, useEffect, useRef, useState } from 'react'

/** Playback selects a reproducible point on the trajectory, independent of frame rate. */
export function useSimulationClock(duration: number, temporarilyPaused = false, loop = true) {
  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(.25)
  const [visible, setVisible] = useState(() => !document.hidden)
  const timeRef = useRef(0)
  const ended = !loop && time >= duration
  const seek = useCallback((next: number) => {
    const value = Math.min(duration, Math.max(0, next))
    timeRef.current = value
    setTime(value)
  }, [duration])
  const reset = useCallback(() => { timeRef.current = 0; setTime(0) }, [])
  useEffect(() => {
    const visibility = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', visibility)
    return () => document.removeEventListener('visibilitychange', visibility)
  }, [])
  useEffect(() => {
    if (!playing || temporarilyPaused || !visible || ended) return
    let handle = 0, previous = performance.now(), lastPaint = previous
    const frame = (now: number) => {
      const dt = Math.min((now - previous) / 1000, .1)
      previous = now
      const next = timeRef.current + dt * speed
      timeRef.current = loop ? next % duration : Math.min(duration, next)
      if (!loop && timeRef.current >= duration) { setTime(duration); return }
      if (now - lastPaint > 1000 / 30) { setTime(timeRef.current); lastPaint = now }
      handle = requestAnimationFrame(frame)
    }
    handle = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(handle)
  }, [playing, speed, duration, temporarilyPaused, visible, loop, ended])
  return { time, playing, speed, ended, setPlaying, setSpeed, seek, reset }
}
