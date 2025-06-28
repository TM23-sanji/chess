from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from stockfish import Stockfish
import os

app = FastAPI()

# Path to stockfish.exe in your folder
STOCKFISH_PATH = os.path.join(os.path.dirname(__file__), "stockfish", "stockfish.exe")

# Initialize stockfish instance
stockfish = Stockfish(path=STOCKFISH_PATH)

class BestMoveRequest(BaseModel):
    fen: str

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/best-move")
def best_move(request: BestMoveRequest):
    print(f"Received FEN: {request.fen}")

    stockfish.set_fen_position(request.fen)
    move = stockfish.get_best_move()
    print(f"Stockfish move: {move}")
    if move is None:
        return {"best_move": ""}
    return {"best_move": move}
