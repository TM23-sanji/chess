const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function fetchBestMove(fen: string): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/best-move`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fen }),
  });

  if (!res.ok) {
    throw new Error('Failed to fetch best move');
  }

  const data: { best_move: string } = await res.json();
  console.log('Best move from backend:', data.best_move);
  return data.best_move;
}
