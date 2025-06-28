
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess, Move, Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Loader2, Crown, User, Bot, RotateCcw } from 'lucide-react';
import { fetchBestMove } from '../lib/api';

export default function ChessGame() {
  const [game, setGame] = useState(() => new Chess());
  const [waitingForEngine, setWaitingForEngine] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [gameStatus, setGameStatus] = useState<string>('Your turn');
  const [gameOver, setGameOver] = useState(false);
  const fenRef = useRef(game.fen());

  const safeGameMutate = useCallback((modify: (game: Chess) => void) => {
    setGame(prev => {
      const updated = new Chess(prev.fen());
      modify(updated);
      fenRef.current = updated.fen();
      return updated;
    });
  }, []);

  const checkGameStatus = useCallback((gameInstance: Chess) => {
    if (gameInstance.isCheckmate()) {
      const winner = gameInstance.turn() === 'w' ? 'AI' : 'You';
      setGameStatus(`Checkmate! ${winner} win!`);
      setGameOver(true);
      return true;
    } else if (gameInstance.isDraw()) {
      setGameStatus('Draw!');
      setGameOver(true);
      return true;
    } else if (gameInstance.isCheck()) {
      const player = gameInstance.turn() === 'w' ? 'You are' : 'AI is';
      setGameStatus(`Check! ${player} in check`);
      return false;
    } else {
      const player = gameInstance.turn() === 'w' ? 'Your turn' : 'AI is thinking...';
      setGameStatus(player);
      return false;
    }
  }, []);

  const onPieceDrop = (sourceSquare: Square, targetSquare: Square): boolean => {
    if (gameOver) return false;

    const possibleMoves = game.moves({ verbose: true });
    const isLegal = possibleMoves.some(
      (m) => m.from === sourceSquare && m.to === targetSquare
    );

    if (!isLegal) {
      setErrorMessage('Invalid move. Please try a legal move.');
      return false;
    }

    let updatedGame: Chess;
    safeGameMutate((g) => {
      g.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });
      updatedGame = g;
    });

    setErrorMessage('');
    
    // Check game status after player move
    const isGameOver = checkGameStatus(updatedGame!);
    if (!isGameOver) {
      setWaitingForEngine(true);
    }
    
    return true;
  };

  useEffect(() => {
    if (!waitingForEngine || gameOver) return;

    const getEngineMove = async () => {
      try {
        const bestMove = await fetchBestMove(fenRef.current);

        if (!bestMove || bestMove.length !== 4) {
          throw new Error('Engine returned an invalid move.');
        }

        let moveApplied = false;
        let updatedGame: Chess;

        safeGameMutate((g) => {
          const moveResult = g.move({
            from: bestMove.slice(0, 2) as Square,
            to: bestMove.slice(2, 4) as Square,
            promotion: 'q',
          });
          if (moveResult) {
            moveApplied = true;
            updatedGame = g;
          }
        });

        if (!moveApplied) {
          setErrorMessage('Engine move was invalid.');
          setGameStatus('Error occurred');
        } else {
          setErrorMessage('');
          // Check game status after AI move
          checkGameStatus(updatedGame!);
        }
      } catch (error) {
        console.error(error);
        setErrorMessage('Error processing engine move.');
        setGameStatus('Error occurred');
      } finally {
        setWaitingForEngine(false);
      }
    };

    getEngineMove();
  }, [waitingForEngine, safeGameMutate, checkGameStatus, gameOver]);

  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    fenRef.current = newGame.fen();
    setErrorMessage('');
    setGameStatus('Your turn');
    setWaitingForEngine(false);
    setGameOver(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Chess Master
          </h1>
          <p className="text-slate-600 text-lg md:text-xl">
            Challenge yourself against the AI
          </p>
        </div>

        <div className="w-full max-w-md mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/40 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                <span className="text-slate-700 font-medium">You</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-700 font-medium">AI</span>
                <Bot className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                {waitingForEngine && <Loader2 className="w-4 h-4 animate-spin text-purple-600" />}
                <span className={`font-semibold ${
                  gameStatus.includes('AI') ? 'text-purple-600' : 
                  gameStatus.includes('Your') ? 'text-blue-600' : 
                  gameStatus.includes('Check') ? 'text-red-500' :
                  gameStatus.includes('Checkmate') ? 'text-red-600' :
                  gameStatus.includes('Draw') ? 'text-yellow-600' :
                  'text-slate-700'
                }`}>
                  {gameStatus}
                </span>
              </div>
              
              {game.isCheck() && !gameOver && (
                <div className="flex items-center justify-center gap-1 text-red-500 text-sm">
                  <Crown className="w-4 h-4" />
                  <span>King in check!</span>
                </div>
              )}

              {gameOver && (
                <div className="mt-3 p-3 bg-slate-100 rounded-lg">
                  <p className="text-slate-600 text-sm">Game Over</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full max-w-[min(90vw,600px)] mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/40 p-4 md:p-8 shadow-xl">
            <div className="aspect-square w-full">
              <Chessboard
                position={game.fen()}
                onPieceDrop={onPieceDrop}
                customBoardStyle={{
                  borderRadius: '1rem',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                }}
                customDarkSquareStyle={{
                  backgroundColor: '#4f46e5',
                }}
                customLightSquareStyle={{
                  backgroundColor: '#e0e7ff',
                }}
                customDropSquareStyle={{
                  backgroundColor: '#fbbf24',
                  boxShadow: 'inset 0 0 0 2px #f59e0b',
                }}
                areArrowsAllowed={true}
                boardOrientation="white"
              />
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="w-full max-w-md mb-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-700 text-center font-medium">{errorMessage}</p>
            </div>
          </div>
        )}

        <button
          onClick={resetGame}
          className="flex items-center gap-2 bg-white/80 hover:bg-white border border-white/40 hover:border-white/60 text-slate-700 font-semibold py-3 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <RotateCcw className="w-4 h-4" />
          New Game
        </button>

        <div className="mt-12 text-center">
          <p className="text-slate-500 text-sm">
            Make your move by dragging pieces on the board
          </p>
        </div>
      </div>
    </div>
  );
}
