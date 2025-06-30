import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from stockfish import Stockfish

app = FastAPI()

STOCKFISH_PATH = os.environ.get("STOCKFISH_PATH", "stockfish")
stockfish = Stockfish(path=STOCKFISH_PATH)

class BestMoveRequest(BaseModel):
    fen: str

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://chess-bice-eta.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.api_route("/", methods=["GET", "HEAD"])
def read_root():
    return {"status": "ok"}

@app.post("/best-move")
def best_move(request: BestMoveRequest):
    stockfish.set_fen_position(request.fen)
    move = stockfish.get_best_move()
    return {"best_move": move or ""}
