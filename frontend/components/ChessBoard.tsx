'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess, Move, Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { fetchBestMove } from '../lib/api';

export default function ChessBoard() {
  const [game, setGame] = useState(() => new Chess());
  const [waitingForEngine, setWaitingForEngine] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [gameOverMessage, setGameOverMessage] = useState<string>('');

  const fenRef = useRef(game.fen());

  // Utility: Check if the game is over
  const checkGameOver = (g: Chess) => {
    if (g.isCheckmate()) {
      const winner = g.turn() === 'w' ? 'Black' : 'White';
      setGameOverMessage(`Checkmate! ${winner} wins.`);
      return true;
    }
    if (g.isStalemate()) {
      setGameOverMessage('Draw by stalemate.');
      return true;
    }
    if (g.isThreefoldRepetition()) {
      setGameOverMessage('Draw by threefold repetition.');
      return true;
    }
    if (g.isInsufficientMaterial()) {
      setGameOverMessage('Draw by insufficient material.');
      return true;
    }
    if (g.isDraw()) {
      setGameOverMessage('Draw.');
      return true;
    }
    return false;
  };

  // Safe game mutation
  const safeGameMutate = useCallback((modify: (game: Chess) => void) => {
    setGame(prev => {
      const updated = new Chess(prev.fen());
      modify(updated);
      fenRef.current = updated.fen();
      return updated;
    });
  }, []);

  // Handle player move
  const onPieceDrop = (sourceSquare: Square, targetSquare: Square): boolean => {
    if (gameOverMessage) {
      setErrorMessage('Game is over. Please reset to play again.');
      return false;
    }

    const possibleMoves = game.moves({ verbose: true });
    const isLegal = possibleMoves.some(
      (m) => m.from === sourceSquare && m.to === targetSquare
    );

    if (!isLegal) {
      setErrorMessage('Invalid move. Please try a legal move.');
      return false;
    }

    safeGameMutate((g) => {
      g.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });
    });

    setErrorMessage('');
    if (!checkGameOver(new Chess(fenRef.current))) {
      setWaitingForEngine(true);
    }
    return true;
  };

  // Handle engine move
  useEffect(() => {
    if (!waitingForEngine) return;

    const getEngineMove = async () => {
      try {
        const bestMove = await fetchBestMove(fenRef.current);

        if (!bestMove || bestMove.length !== 4) {
          throw new Error('Engine returned an invalid move.');
        }

        let moveApplied = false;

        safeGameMutate((g) => {
          const moveResult = g.move({
            from: bestMove.slice(0, 2) as Square,
            to: bestMove.slice(2, 4) as Square,
            promotion: 'q',
          });
          if (moveResult) moveApplied = true;
        });

        if (!moveApplied) {
          setErrorMessage('Engine move was invalid.');
        } else {
          setErrorMessage('');
          checkGameOver(new Chess(fenRef.current));
        }
      } catch (error) {
        console.error(error);
        setErrorMessage('Error processing engine move.');
      } finally {
        setWaitingForEngine(false);
      }
    };

    getEngineMove();
  }, [waitingForEngine, safeGameMutate]);

  const onNewGame = () => {
    setGame(new Chess());
    setErrorMessage('');
    setGameOverMessage('');
    setWaitingForEngine(false);
    fenRef.current = new Chess().fen();
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <Chessboard
        position={game.fen()}
        onPieceDrop={onPieceDrop}
        boardWidth={500}
      />
      {errorMessage && (
        <p style={{ color: 'red', marginTop: '10px' }}>{errorMessage}</p>
      )}
      {gameOverMessage && (
        <>
          <p style={{ color: 'green', marginTop: '10px' }}>{gameOverMessage}</p>
          <button onClick={onNewGame} style={{ marginTop: '10px' }}>
            New Game
          </button>
        </>
      )}
    </div>
  );
}
