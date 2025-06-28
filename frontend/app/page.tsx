// app/page.tsx
import ChessBoard from '../components/ChessBoard';

export default function Home() {
  return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Play Chess vs Stockfish</h1>
      <ChessBoard />
    </main>
  );
}
