'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

type SetWinner = 'player1' | 'player2' | null

export default function ScorePage() {
  const [scores, setScores] = useState({ player1: 0, player2: 0 })
  const [setsWon, setSetsWon] = useState({ player1: 0, player2: 0 })
  const [setNumber, setSetNumber] = useState(1)
  const [setHistory, setSetHistory] = useState<SetWinner[]>([])
  const [names, setNames] = useState({ player1: 'ผู้เล่น 1', player2: 'ผู้เล่น 2' })
  const [editMode, setEditMode] = useState(false)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop'>('mobile')
  const [setWinner, setSetWinner] = useState<'player1' | 'player2' | null>(null)
  const [matchWinner, setMatchWinner] = useState<'player1' | 'player2' | null>(null)

  useEffect(() => {
    const handleOrientationChange = () => {
      const isPortrait = window.innerHeight > window.innerWidth
      setOrientation(isPortrait ? 'portrait' : 'landscape')
      const isMobile = window.innerWidth < 1024
      setDeviceType(isMobile ? 'mobile' : 'desktop')
    }

    handleOrientationChange()
    window.addEventListener('orientationchange', handleOrientationChange)
    window.addEventListener('resize', handleOrientationChange)
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange)
      window.removeEventListener('resize', handleOrientationChange)
    }
  }, [])

  const checkSetWinner = (p1: number, p2: number) => {
    if (p1 >= 21 && p1 - p2 >= 2) return 'player1'
    if (p2 >= 21 && p2 - p1 >= 2) return 'player2'
    return null
  }

  const addScore = (player: 'player1' | 'player2') => {
    if (setWinner || matchWinner) return

    setScores(prev => {
      const newScores = { ...prev, [player]: prev[player] + 1 }
      const winner = checkSetWinner(newScores.player1, newScores.player2)

      if (winner && !setWinner) {  // Only process if we haven't already detected a winner
        // Calculate new sets won count
        const newSetsWonCount = setsWon[winner as 'player1' | 'player2'] + 1

        setSetWinner(winner)
        setSetsWon(s => ({ ...s, [winner]: newSetsWonCount }))
        setSetHistory(prev => {
          // Only add if not already added for this set
          if (prev.length < setNumber) {
            return [...prev, winner]
          }
          return prev
        })

        // Check if match is won (2 sets)
        if (newSetsWonCount === 2) {
          setMatchWinner(winner)
        }
      }
      return newScores
    })
  }

  const removeScore = (player: 'player1' | 'player2') => {
    if (setWinner || matchWinner) return
    setScores(prev => ({ ...prev, [player]: Math.max(0, prev[player] - 1) }))
  }

  const nextSet = () => {
    if (!setWinner && !matchWinner) return

    const newSetNumber = setNumber + 1

    // Check if match is already won (2-0)
    if (matchWinner) {
      return
    }

    // Only allow up to 3 sets for best of 3
    if (newSetNumber <= 3) {
      setSetNumber(newSetNumber)
      setScores({ player1: 0, player2: 0 })
      setSetWinner(null)
    }
  }

  const resetAll = () => {
    setScores({ player1: 0, player2: 0 })
    setSetsWon({ player1: 0, player2: 0 })
    setSetNumber(1)
    setSetHistory([])
    setSetWinner(null)
    setMatchWinner(null)
  }

  const isMobileLayout = deviceType === 'mobile'
  const isPortrait = orientation === 'portrait'
  const matchOver = matchWinner !== null
  const setOver = setWinner !== null

  const getSetLabel = (setNum: number, winner: SetWinner) => {
    if (!winner) return `เซต ${setNum}`
    const winnerName = winner === 'player1' ? names.player1 : names.player2
    return `เซต ${setNum}: ${winnerName}`
  }

  return (
    <main className={`min-h-svh bg-gradient-to-b from-blue-500 to-red-500 flex flex-col ${
      !isMobileLayout ? 'justify-center items-center px-4' : ''
    }`}>
      {/* Desktop Container */}
      {!isMobileLayout && (
        <div className="w-full max-w-2xl bg-gradient-to-b from-blue-500 to-red-500 rounded-2xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="px-6 py-4 text-white text-center bg-black/20">
            <h1 className="text-3xl font-bold">นับสกอร์แบดมินตัน</h1>
            <div className="text-base mt-2 font-semibold">
              {matchOver ? `${matchWinner === 'player1' ? names.player1 : names.player2} ชนะรอบ!` :
               `เซต ${setNumber} | ชนะ ${setsWon.player1} - ${setsWon.player2}`}
            </div>
            {setHistory.length > 0 && (
              <div className="text-xs mt-2 space-y-1">
                {setHistory.map((winner, i) => (
                  <div key={i}>
                    {getSetLabel(i + 1, winner)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Score Display - Desktop */}
          <div className="grid grid-cols-2 gap-0 min-h-96">
            {/* Player 1 */}
            <div
              className={`bg-blue-600 flex flex-col items-center justify-between p-8 cursor-pointer hover:opacity-90 active:opacity-75 transition-opacity ${
                matchWinner === 'player1' ? 'ring-4 ring-yellow-300' : ''
              }`}
              onClick={() => addScore('player1')}
            >
              <p className="text-white text-lg font-bold text-center w-full truncate">{names.player1}</p>
              <p className="text-white text-9xl font-black font-mono leading-none py-8">{scores.player1}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeScore('player1')
                }}
                disabled={setOver || matchOver}
                className="text-white text-lg font-bold px-8 py-3 border-2 border-white rounded-lg hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all w-full"
              >
                -1
              </button>
            </div>

            {/* Player 2 */}
            <div
              className={`bg-red-600 flex flex-col items-center justify-between p-8 cursor-pointer hover:opacity-90 active:opacity-75 transition-opacity ${
                matchWinner === 'player2' ? 'ring-4 ring-yellow-300' : ''
              }`}
              onClick={() => addScore('player2')}
            >
              <p className="text-white text-lg font-bold text-center w-full truncate">{names.player2}</p>
              <p className="text-white text-9xl font-black font-mono leading-none py-8">{scores.player2}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeScore('player2')
                }}
                disabled={setOver || matchOver}
                className="text-white text-lg font-bold px-8 py-3 border-2 border-white rounded-lg hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all w-full"
              >
                -1
              </button>
            </div>
          </div>

          {/* Set Won Message - Desktop */}
          {setOver && (
            <div className="bg-yellow-400 text-black text-center py-4 font-black text-xl">
              🎉 {setWinner === 'player1' ? names.player1 : names.player2} ชนะเซต {setNumber}!
            </div>
          )}

          {/* Match Won Message - Desktop */}
          {matchOver && (
            <div className="bg-green-500 text-white text-center py-4 font-black text-2xl">
              👑 {matchWinner === 'player1' ? names.player1 : names.player2} ชนะรอบ!
            </div>
          )}

          {/* Controls - Desktop */}
          <div className="bg-black/30 px-6 py-4 flex gap-3">
            {setOver && !matchOver && (
              <button
                className="flex-1 text-white text-base font-bold py-3 px-4 rounded-lg border border-white hover:bg-white/20 transition-all"
                onClick={nextSet}
              >
                เซตถัดไป
              </button>
            )}
            <button
              className="flex-1 text-white text-base font-bold py-3 px-4 rounded-lg border border-white hover:bg-white/20 transition-all"
              onClick={resetAll}
            >
              รีเซ็ตทั้งหมด
            </button>
            <button
              className="flex-1 text-white text-base font-bold py-3 px-4 rounded-lg border border-white hover:bg-white/20 transition-all"
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? 'เสร็จ' : 'แก้ไขชื่อ'}
            </button>
          </div>

          {/* Edit Mode - Desktop */}
          {editMode && (
            <div className="bg-background border-t px-6 py-4 space-y-4">
              <input
                type="text"
                value={names.player1}
                onChange={(e) => setNames(prev => ({ ...prev, player1: e.target.value }))}
                placeholder="ชื่อผู้เล่น 1"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base font-semibold"
                maxLength={20}
              />
              <input
                type="text"
                value={names.player2}
                onChange={(e) => setNames(prev => ({ ...prev, player2: e.target.value }))}
                placeholder="ชื่อผู้เล่น 2"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base font-semibold"
                maxLength={20}
              />
            </div>
          )}
        </div>
      )}

      {/* Mobile Layout */}
      {isMobileLayout && (
        <>
          {/* Header */}
          <div className="px-4 py-3 text-white text-center bg-black/20 w-full">
            <h1 className="text-2xl font-bold">นับสกอร์แบดมินตัน</h1>
            <div className="text-sm mt-2 font-semibold">
              {matchOver ? `${matchWinner === 'player1' ? names.player1 : names.player2} ชนะรอบ!` :
               `เซต ${setNumber} | ชนะ ${setsWon.player1} - ${setsWon.player2}`}
            </div>
            {setHistory.length > 0 && (
              <div className="text-xs mt-2 space-y-1">
                {setHistory.map((winner, i) => (
                  <div key={i} className="text-white/80">
                    {getSetLabel(i + 1, winner)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Score Display - Mobile */}
          <div className={`flex-1 gap-0 w-full ${
            isPortrait ? 'flex flex-col' : 'grid grid-cols-2'
          }`}>
            {/* Player 1 */}
            <div
              className={`bg-blue-600 flex flex-col items-center justify-between p-6 cursor-pointer active:opacity-75 transition-opacity ${
                matchWinner === 'player1' ? 'ring-4 ring-yellow-300' : ''
              }`}
              onClick={() => addScore('player1')}
            >
              <p className="text-white text-base font-bold text-center w-full truncate">{names.player1}</p>
              <p className="text-white text-9xl font-black font-mono leading-none py-6">{scores.player1}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeScore('player1')
                }}
                disabled={setOver || matchOver}
                className="text-white text-lg font-bold px-6 py-3 border-2 border-white rounded-lg hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all w-full"
              >
                -1
              </button>
            </div>

            {/* Player 2 */}
            <div
              className={`bg-red-600 flex flex-col items-center justify-between p-6 cursor-pointer active:opacity-75 transition-opacity ${
                matchWinner === 'player2' ? 'ring-4 ring-yellow-300' : ''
              }`}
              onClick={() => addScore('player2')}
            >
              <p className="text-white text-base font-bold text-center w-full truncate">{names.player2}</p>
              <p className="text-white text-9xl font-black font-mono leading-none py-6">{scores.player2}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeScore('player2')
                }}
                disabled={setOver || matchOver}
                className="text-white text-lg font-bold px-6 py-3 border-2 border-white rounded-lg hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all w-full"
              >
                -1
              </button>
            </div>
          </div>

          {/* Set Won Message - Mobile */}
          {setOver && (
            <div className="bg-yellow-400 text-black text-center py-4 font-black text-xl w-full">
              🎉 {setWinner === 'player1' ? names.player1 : names.player2} ชนะเซต {setNumber}!
            </div>
          )}

          {/* Match Won Message - Mobile */}
          {matchOver && (
            <div className="bg-green-500 text-white text-center py-4 font-black text-2xl w-full">
              👑 {matchWinner === 'player1' ? names.player1 : names.player2} ชนะรอบ!
            </div>
          )}

          {/* Controls - Mobile */}
          <div className="bg-black/30 px-4 py-4 flex gap-3 w-full">
            {setOver && !matchOver && (
              <Button
                variant="outline"
                className="flex-1 text-base font-bold h-14 rounded-lg"
                onClick={nextSet}
              >
                เซตถัดไป
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1 text-base font-bold h-14 rounded-lg"
              onClick={resetAll}
            >
              รีเซ็ตทั้งหมด
            </Button>
            <Button
              variant="outline"
              className="flex-1 text-base font-bold h-14 rounded-lg"
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? 'เสร็จ' : 'แก้ไขชื่อ'}
            </Button>
          </div>

          {/* Edit Mode - Mobile */}
          {editMode && (
            <div className="bg-background border-t px-4 py-4 space-y-4 w-full">
              <input
                type="text"
                value={names.player1}
                onChange={(e) => setNames(prev => ({ ...prev, player1: e.target.value }))}
                placeholder="ชื่อผู้เล่น 1"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base font-semibold"
                maxLength={20}
              />
              <input
                type="text"
                value={names.player2}
                onChange={(e) => setNames(prev => ({ ...prev, player2: e.target.value }))}
                placeholder="ชื่อผู้เล่น 2"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base font-semibold"
                maxLength={20}
              />
            </div>
          )}
        </>
      )}
    </main>
  )
}
