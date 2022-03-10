package brain

import (
	rules "github.com/BattlesnakeOfficial/rules"
	//gl "github.com/nosnaws/shai-hulud/game_logic"
	//"math"
)

type node struct {
	move string
	gs   rules.BoardState
	rs   rules.Ruleset
	you  *rules.Snake
}

//func minimax(node node, depth, alpha, beta int, maxPlayer bool) node {
//isWrapped := node.rs.Name() == "wrapped"
//isGameOver, _ := node.rs.IsGameOver(&node.gs)
//if depth < 1 || isGameOver {
//return node // TODO: add heuristic
//}

//if maxPlayer {
//value := math.Inf
//bestGS := node.gs

//for _, move := range gl.GetMoves(node.gs, *node.you, isWrapped) {
//ns := node.gs.Clone()
//sm := rules.SnakeMove{ID: node.you.ID, Move: move.Name}
//}
//}
//}
