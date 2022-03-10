package game_logic

import (
	rules "github.com/BattlesnakeOfficial/rules"
)

type Move struct {
	Point rules.Point
	Name  string
}

func GetNeighbors(state rules.BoardState, head rules.Point, isWrapped bool) []Move {
	neighbors := []Move{
		{
			Point: rules.Point{X: head.X - 1, Y: head.Y}, Name: "left",
		},
		{
			Point: rules.Point{X: head.X + 1, Y: head.Y}, Name: "right",
		},
		{
			Point: rules.Point{X: head.X, Y: head.Y - 1}, Name: "down",
		},
		{
			Point: rules.Point{X: head.X, Y: head.Y + 1}, Name: "up",
		},
	}

	var possibleMoves []Move

	for _, n := range neighbors {
		if isWrapped == true {
			n = adjustForWrapped(n, state.Height, state.Width)
		}

		inBounds := isInBounds(n.Point, state.Height, state.Width)
		if inBounds && !isSnake(state, n.Point) {
			possibleMoves = append(possibleMoves, n)
		}
	}

	return possibleMoves
}

func GetMoves(state rules.BoardState, snake rules.Snake, isWrapped bool) []Move {
	head := snake.Body[0]
	neck := snake.Body[1]

	neighbors := []Move{
		{
			Point: rules.Point{X: head.X - 1, Y: head.Y}, Name: "left",
		},
		{
			Point: rules.Point{X: head.X + 1, Y: head.Y}, Name: "right",
		},
		{
			Point: rules.Point{X: head.X, Y: head.Y - 1}, Name: "down",
		},
		{
			Point: rules.Point{X: head.X, Y: head.Y + 1}, Name: "up",
		},
	}

	var possibleMoves []Move

	for _, n := range neighbors {
		if isWrapped == true {
			n = adjustForWrapped(n, state.Height, state.Width)
		}

		inBounds := isInBounds(n.Point, state.Height, state.Width)
		if n.Point != neck && inBounds && !isSnake(state, n.Point) {
			possibleMoves = append(possibleMoves, n)
		}
	}

	return possibleMoves
}

func isInBounds(c rules.Point, h, w int32) bool {
	if c.X < 0 || c.X >= w {
		return false
	}

	if c.Y < 0 || c.Y >= h {
		return false
	}

	return true
}

func adjustForWrapped(c Move, h, w int32) Move {
	newX := c.Point.X
	newY := c.Point.Y
	name := c.Name

	if newX < 0 {
		newX = w - 1
	}
	if newY < 0 {
		newY = h - 1
	}

	if newX >= w {
		newX = 0
	}
	if newY >= h {
		newY = 0
	}

	adjustedMove := Move{Point: rules.Point{X: newX, Y: newY}, Name: name}
	return adjustedMove
}

func isSnake(state rules.BoardState, c rules.Point) bool {
	for _, snake := range state.Snakes {
		l := len(snake.Body)
		tail := snake.Body[l-1]
		for i := 0; i < l-1; i++ {
			if snake.Body[i] == c && snake.Body[i] != tail {
				return true
			}
		}

		if tail == c && didSnakeEat(snake) {
			return true
		}
	}

	return false
}

func didSnakeEat(snake rules.Snake) bool {
	length := len(snake.Body)
	return snake.Body[length-1] == snake.Body[length-2]
}
