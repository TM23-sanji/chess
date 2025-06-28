from fastapi import FastAPI
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

@app.post("/best-move")
def best_move(request: BestMoveRequest):
    stockfish.set_fen_position(request.fen)
    move = stockfish.get_best_move()
    return {"best_move": move}
