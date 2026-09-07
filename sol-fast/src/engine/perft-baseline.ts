import { createInitialState } from './board'
import { perft } from './validation'

const state = createInitialState()
for (const depth of [1, 2, 3]) {
  console.log(`depth ${depth}: ${perft(state, depth)}`)
}