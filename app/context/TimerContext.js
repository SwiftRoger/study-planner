"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";

const TimerContext = createContext();

export function TimerProvider({ children }) {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState("study");
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef(null);
  const timeRef = useRef({ minutes: 25, seconds: 0 });

  const modes = {
    study: { label: "Study", minutes: 25, color: "#4F8CFF" },
    short: { label: "Short Break", minutes: 5, color: "#22c55e" },
    long: { label: "Long Break", minutes: 15, color: "#a855f7" },
  };

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        let { minutes: m, seconds: s } = timeRef.current;
        if (s === 0) {
          if (m === 0) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            if (mode === "study") setSessions(prev => prev + 1);
            return;
          }
          m = m - 1;
          s = 59;
        } else {
          s = s - 1;
        }
        timeRef.current = { minutes: m, seconds: s };
        setMinutes(m);
        setSeconds(s);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, mode]);

  function switchMode(newMode) {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setMode(newMode);
    const m = modes[newMode].minutes;
    timeRef.current = { minutes: m, seconds: 0 };
    setMinutes(m);
    setSeconds(0);
  }

  function reset() {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    const m = modes[mode].minutes;
    timeRef.current = { minutes: m, seconds: 0 };
    setMinutes(m);
    setSeconds(0);
  }

  return (
    <TimerContext.Provider value={{
      minutes, seconds, isRunning, setIsRunning,
      mode, switchMode, reset, sessions, modes
    }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  return useContext(TimerContext);
}