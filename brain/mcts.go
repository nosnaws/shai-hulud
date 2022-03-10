package brain

import (
	"fmt"
	"math"
	"math/rand"
	"sort"
	"time"

	gameSim "github.com/BattlesnakeOfficial/rules"
	set "github.com/deckarep/golang-set"
	gl "github.com/nosnaws/shai-hulud/game_logic"
)

type Node struct {
	state    State
	parent   *Node
	children []*Node
	move     gl.Move
	played   bool
}

type Tree struct {
	root Node
}

type State struct {
	bs           gameSim.BoardState
	rs           gameSim.Ruleset
	you          *gameSim.Snake
	visitedCount int32
	score        int32
	scores       map[string]int32
}

func DetermineMove(gameState gl.GameState) string {
	bs := createBoardState(gameState)
	rs := determineRuleset(gameState)
	you := getSnake(gameState.You.ID, bs.Snakes)

	move := gl.Move{Point: you.Body[0], Name: "left"}
	root := createNode(nil, *bs, rs, you, move)
	dur, _ := time.ParseDuration("300ms")
	bestGS := mcts(&root, time.Now().Add(dur))

	fmt.Println("potential moves")
	for i := 0; i < len(root.children); i++ {
		if len(root.children) > i {
			fmt.Println(root.children[i].move)
			fmt.Println(root.children[i].state.scores[you.ID])
			fmt.Println(root.children[i].state.visitedCount)
		}
	}

	fmt.Println("selected move")
	fmt.Println(bestGS)
	return bestGS.Name
}

func createBoardState(gs gl.GameState) *gameSim.BoardState {
	snakes := gs.Board.Snakes
	var snakeIds []string
	for _, s := range snakes {
		snakeIds = append(snakeIds, s.ID)
	}
	bs := gameSim.NewBoardState(int32(gs.Board.Width), int32(gs.Board.Height))

	for _, s := range snakes {
		gameSim.PlaceSnake(bs, s.ID, coordsToPoints(s.Body))
	}
	bs.Food = coordsToPoints(gs.Board.Food)
	bs.Hazards = coordsToPoints(gs.Board.Hazards)

	return bs
}

func coordsToPoints(coords []gl.Coord) []gameSim.Point {
	var points []gameSim.Point
	for _, c := range coords {
		points = append(points, gameSim.Point{X: int32(c.X), Y: int32(c.Y)})
	}

	return points
}

func determineRuleset(gs gl.GameState) gameSim.Ruleset {
	name := gs.Game.Ruleset.Name
	hazardDmg := gs.Game.Ruleset.Settings.HazardDamagePerTurn
	minFood := gs.Game.Ruleset.Settings.MinimumFood
	foodSpawnChance := gs.Game.Ruleset.Settings.FoodSpawnChance

	switch name {
	case "solo":
		rs := gameSim.StandardRuleset{FoodSpawnChance: foodSpawnChance, MinimumFood: minFood, HazardDamagePerTurn: hazardDmg}
		soloRS := gameSim.SoloRuleset{rs}
		return &soloRS
	case "wrapped":
		rs := gameSim.StandardRuleset{FoodSpawnChance: foodSpawnChance, MinimumFood: minFood, HazardDamagePerTurn: hazardDmg}
		wrappedRS := gameSim.WrappedRuleset{rs}
		return &wrappedRS
	default:
		rs := gameSim.StandardRuleset{FoodSpawnChance: foodSpawnChance, MinimumFood: minFood, HazardDamagePerTurn: hazardDmg}
		return &rs
	}
}

func createNode(parent *Node, bs gameSim.BoardState, rs gameSim.Ruleset, you *gameSim.Snake, move gl.Move) Node {
	scores := make(map[string]int32)
	for _, s := range bs.Snakes {
		scores[s.ID] = 0
	}

	state := State{bs: bs, rs: rs, you: you, visitedCount: 0, score: 0, scores: scores}
	var children []*Node
	return Node{state: state, parent: parent, children: children, move: move, played: false}
}

func mcts(root *Node, cutOff time.Time) gl.Move {
	for !time.Now().After(cutOff) {
		leaf := selectNode(root)
		//isGameOver, _ := leaf.state.rs.IsGameOver(&leaf.state.bs)
		if !leaf.played {
			//fmt.Println("expanding node")
			expandNode(leaf)
		}

		if len(leaf.children) > 0 {
			//fmt.Println("getting random child node")
			leaf = leaf.children[rand.Intn(len(leaf.children))] // Play a random child
		} else {
			//fmt.Println("no children, running current")
		}
		simResult := rollout(leaf)

		backpropagate(leaf, simResult)
	}

	fmt.Println("possible moves")
	fmt.Println(gl.GetMoves(root.state.bs, *root.state.you, root.state.rs.Name() == "wrapped"))
	//fmt.Println(root.children)
	you := root.state.you
	sort.Slice(root.children, func(i, j int) bool {
		return root.children[i].state.scores[you.ID] > root.children[j].state.scores[you.ID]
	})
	return root.children[0].move
	//isWrapped := root.state.rs.Name() == "wrapped"
	//bestMove := getBestMoveForSnake(root, root.state.you.ID)
	//movesWithDir := gl.GetMoves(root.state.bs, *root.state.you, isWrapped)
	//for _, m := range movesWithDir {
	//if m.Point == bestMove {
	//return m
	//}
	//}

	//fmt.Println("something went very wrong, going left")
	//return gl.Move{Point: gameSim.Point{X: root.state.you.Body[0].X - 1, Y: root.state.you.Body[0].Y}, Name: "left"}
}

func bestChild(root *Node) *Node {
	children := root.children
	sort.Slice(children, func(i, j int) bool {
		return children[i].state.visitedCount > children[j].state.visitedCount
	})

	if len(children) > 0 {
		return children[0]
	}
	return root
}

func backpropagate(node *Node, simResult map[string]int32) {
	if node == nil {
		return
	}
	for id, score := range simResult {
		node.state.scores[id] += score
	}
	//node.state.score = node.state.score + simResult
	node.state.visitedCount = node.state.visitedCount + 1
	backpropagate(node.parent, simResult)
}

func rollout(root *Node) map[string]int32 {
	bs := root.state.bs
	rs := root.state.rs
	isWrapped := root.state.rs.Name() == "wrapped"

	ns := bs.Clone()
	isGameOver, _ := rs.IsGameOver(ns)
	for !isGameOver {
		var moves []gameSim.SnakeMove
		for _, snake := range ns.Snakes {
			if snake.EliminatedCause != "" {
				continue
			}
			randomMove := getRandomMove(ns, &snake, isWrapped)
			//fmt.Println("random move")
			//fmt.Println(randomMove)
			moves = append(moves, gameSim.SnakeMove{ID: snake.ID, Move: randomMove.Name})
		}
		ns, _ = rs.CreateNextBoardState(ns.Clone(), moves)
		//root.state.bs = *ns
		//root.state.you = getSnake(root.state.you.ID, ns.Snakes)
		isGameOver, _ = rs.IsGameOver(ns)
	}

	root.played = true
	scores := make(map[string]int32)
	for _, s := range ns.Snakes {
		if s.EliminatedCause == "" {
			scores[s.ID]++
		} else if s.EliminatedCause != "" {
			scores[s.ID]--
		}
	}
	return scores

	//if finalYou.EliminatedCause == "" {
	////fmt.Println("rollout we win!", root.move.Name, root.state.score)
	////for _, s := range ns.Snakes {
	////fmt.Println(s.ID == root.state.you.ID, s.EliminatedCause)
	////}
	//return 1
	//}

	//for _, s := range root.state.bs.Snakes {
	//if s.EliminatedCause == "" {

	////fmt.Println("rollout: we lose...")
	//return -1
	//}
	//}
	////fmt.Println("rollout: draw")
	//return 0
}

func getRandomMove(bs *gameSim.BoardState, snake *gameSim.Snake, isWrapped bool) gl.Move {
	moves := gl.GetMoves(*bs, *snake, isWrapped)
	head := snake.Body[0]
	if len(moves) < 1 {
		return gl.Move{Point: gameSim.Point{X: head.X - 1, Y: head.Y}, Name: "left"}
	}
	randomIdx := rand.Intn(len(moves))
	return moves[randomIdx]
}

func selectNode(root *Node) *Node {
	type MovePair struct {
		string
		gameSim.Point
	}

	children := root.children

	if len(children) < 1 {
		return root
	}
	// get best move for each player
	bestMoves := set.NewSet()
	for _, i := range root.state.bs.Snakes {
		if i.EliminatedCause == "" {
			bestMoves.Add(MovePair{i.ID, getBestMoveForSnake(root, i.ID)})
		}
	}

	fmt.Println("best moves", bestMoves)
	// find state that uses the best moves for each player
	child := children[0]
	for _, c := range children {
		heads := set.NewSet()
		for _, s := range c.state.bs.Snakes {
			if s.EliminatedCause == "" {
				heads.Add(MovePair{s.ID, s.Body[0]})
			}
		}

		fmt.Println("cur child moves", heads)
		if heads.Equal(bestMoves) {
			fmt.Println("found best moves", c)
			child = c
		}
	}

	// continue down the tree
	return selectNode(child)

	//sort.Slice(children, func(i, j int) bool {
	//valI := getUTCValue(children[i])
	//valJ := getUTCValue(children[j])
	//return valI > valJ
	//})
	//for _, c := range children {
	//fmt.Printf(" %f", getUTCValue(c.state.visitedCount, c.state.score, root.state.visitedCount))
	//}
	//fmt.Print("\n")
	//fmt.Printf("picking leaf %s\n", children[0].move.Name)
	//child := children[0]
	//return selectNode(children[0])
}

func getBestMoveForSnake(node *Node, id string) gameSim.Point {
	children := node.children

	sort.Slice(children, func(i, j int) bool {
		valI := getUTCValue(children[i], id)
		valJ := getUTCValue(children[j], id)
		return valI > valJ
	})

	for _, c := range children {
		fmt.Println("move found:", id, getUTCValue(c, id), getSnake(id, c.state.bs.Snakes).Body[0])
	}

	snake := getSnake(id, children[0].state.bs.Snakes)
	return snake.Body[0]
}

func getUTCValue(node *Node, snakeId string) float64 {
	visitedCount := float64(node.state.visitedCount)
	score := float64(node.state.scores[snakeId])
	parentVisitedCount := float64(node.parent.state.visitedCount)

	if visitedCount == 0 {
		return math.MaxFloat64
	}

	//nodeHScore := 5 * float64(nodeHeuristic(node))
	//fmt.Println(nodeHScore, node.move)
	c := 2.4 //math.Sqrt(20)
	parentVLog := math.Log(float64(parentVisitedCount))

	return score/visitedCount + c*math.Sqrt(parentVLog/visitedCount)
}

func expandNode(root *Node) *Node {
	you := *root.state.you
	otherSnakes := getOtherSnakes(you.ID, root.state.bs.Snakes)
	isWrapped := root.state.rs.Name() == "wrapped"
	bs := root.state.bs
	rs := root.state.rs

	for _, myMove := range gl.GetMoves(bs, you, isWrapped) {
		mySnakeMove := gameSim.SnakeMove{ID: you.ID, Move: myMove.Name}

		maxEMoves := 0
		for _, s := range otherSnakes {
			numMoves := len(gl.GetMoves(bs, s, isWrapped))
			if numMoves > maxEMoves {
				maxEMoves = numMoves
			}
		}

		for i := 0; i < maxEMoves; i++ {
			moves := []gameSim.SnakeMove{mySnakeMove}
			for _, eSnake := range otherSnakes {
				if eSnake.EliminatedCause != "" {
					continue
				}

				eMoves := gl.GetMoves(bs, eSnake, isWrapped)
				if len(eMoves) < 1 {
					eMoves = append(eMoves, gl.Move{Point: gameSim.Point{X: eSnake.Body[0].X - 1, Y: eSnake.Body[0].Y}, Name: "left"})
				}
				var eMove gameSim.SnakeMove

				eMove = gameSim.SnakeMove{ID: eSnake.ID, Move: eMoves[i%len(eMoves)].Name}

				moves = append(moves, eMove)
			}

			ns, _ := rs.CreateNextBoardState(bs.Clone(), moves)
			newYou := getSnake(you.ID, ns.Snakes)
			newChild := createNode(root, *ns, rs, newYou, myMove)

			root.children = append(root.children, &newChild)
		}
	}

	//fmt.Printf("expandNode for move: %s", root.move.Name)
	//fmt.Println(len(root.children))
	return root
}

func getSafeMoves(bs gameSim.BoardState, snake gameSim.Snake, isWrapped bool) []gl.Move {
	otherSnakes := getOtherSnakes(snake.ID, bs.Snakes)
	var biggerSnakes []gameSim.Snake
	for _, s := range otherSnakes {
		if len(s.Body) >= len(snake.Body) {
			biggerSnakes = append(biggerSnakes, s)
		}
	}
	var otherSnakesMoves []gl.Move
	for _, s := range biggerSnakes {
		for _, m := range gl.GetMoves(bs, s, isWrapped) {
			otherSnakesMoves = append(otherSnakesMoves, m)
		}
	}
	isUnSafeMove := func(m gl.Move) bool {
		for _, bm := range otherSnakesMoves {
			if bm.Point == m.Point {
				return true
			}
		}
		return false
	}

	myPossibleMoves := gl.GetMoves(bs, snake, isWrapped)
	var safeMoves []gl.Move
	for _, m := range myPossibleMoves {
		if !isUnSafeMove(m) {
			safeMoves = append(safeMoves, m)
		}
	}

	return safeMoves
}

func getSnake(id string, snakes []gameSim.Snake) *gameSim.Snake {
	for _, snake := range snakes {
		if snake.ID == id {
			return &snake
		}
	}
	return nil
}

func getOtherSnakes(id string, snakes []gameSim.Snake) []gameSim.Snake {
	var otherSnakes []gameSim.Snake
	for _, snake := range snakes {
		if snake.ID != id {
			otherSnakes = append(otherSnakes, snake)
		}
	}
	return otherSnakes
}

func nodeHeuristic(node *Node) int32 {
	//bs := node.state.bs
	//isWrapped := node.state.rs.Name() == "wrapped"
	//moves := gl.GetMoves(bs, *node.state.you, isWrapped)

	total := int32(0)

	//moveScore := 1 * int32(len(moves))
	//total = total + moveScore

	allSiblings := node.parent.children
	for _, s := range allSiblings {
		if s != node && s.move == node.move && s.state.you.EliminatedCause != "" {
			// we picked this same move and died in another sibling
			total = total + -1
		}
	}
	//total = total + voronoi(&node.state)/10
	return total
}

func voronoi(state *State) int32 {
	type Pair struct {
		snakeId string
		point   gameSim.Point
	}
	isWrapped := state.rs.Name() == "wrapped"
	you := state.you
	counts := make(map[string]int)

	DEPTH_MARK := Pair{snakeId: "", point: gameSim.Point{X: -1, Y: -1}}
	VISITED_MARK := ""
	var queue []Pair
	visited := make(map[gameSim.Point]string)

	for _, s := range state.bs.Snakes {
		pair := Pair{point: s.Body[0], snakeId: s.ID}

		queue = append(queue, pair)
		visited[pair.point] = pair.snakeId
	}

	for len(queue) > 0 {
		pair := queue[0]
		queue = queue[1:]

		if pair == DEPTH_MARK {
			queue = append(queue, DEPTH_MARK)

			if queue[0] == DEPTH_MARK {
				break // we done
			}
		} else {

			for _, m := range gl.GetNeighbors(state.bs, pair.point, isWrapped) {
				if s, ok := visited[m.Point]; ok {

					if s != VISITED_MARK && s != pair.snakeId {
						if _, ok := counts[s]; !ok {
							counts[s] = 0
						}
						counts[s] = counts[s] - 1

						visited[m.Point] = VISITED_MARK
					}

				} else {
					if _, ok := counts[pair.snakeId]; !ok {
						counts[pair.snakeId] = 0
					}
					counts[pair.snakeId] = counts[pair.snakeId] + 1

					visited[m.Point] = pair.snakeId
					queue = append(queue, Pair{snakeId: pair.snakeId, point: m.Point})
				}
			}
		}
	}

	return int32(counts[you.ID])
}
