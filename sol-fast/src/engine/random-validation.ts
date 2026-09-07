import { validateRandomGames } from './validation'

const result = validateRandomGames()
console.log(`Validated ${result.games} games and ${result.positions} positions; ${result.completed} reached a rules-based result.`)
if (result.completed !== result.games) {
	throw new Error(`${result.games - result.completed} games did not finish within the ply limit.`)
}
