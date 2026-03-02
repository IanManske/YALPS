import { Coefficients, Model } from "./types.js"

// The tableau representing the problem.
// matrix is a 2D matrix (duh) represented as a 1D array.
// The first row, 0, is the objective row.
// The first column, 0, is the RHS column.
// Positions are numbered starting at the first column and ending at the last row.
// Thus, the position of the variable in the first row is width.
export type Tableau = {
  readonly matrix: Float64Array
  readonly width: number
  readonly height: number
  readonly positionOfVariable: Int32Array
  readonly variableAtPosition: Int32Array
}

export const index = (tableau: Tableau, row: number, col: number) => tableau.matrix[Math.imul(row, tableau.width) + col]

export const update = (tableau: Tableau, row: number, col: number, value: number) => {
  tableau.matrix[Math.imul(row, tableau.width) + col] = value
}

// A tableau with some additional context.
export type TableauModel<VariableKey = string> = {
  readonly tableau: Tableau
  readonly sign: number
  readonly variables: readonly VariableKey[]
  readonly integers: readonly number[]
}

type MaybeRecord<K, V> = [K] extends [string] ? Readonly<Partial<Record<K, V>>> : never

const isIterable = <K, V>(seq: Iterable<readonly [K, V]> | MaybeRecord<K, V>): seq is Iterable<readonly [K, V]> =>
  Symbol.iterator in seq && typeof seq[Symbol.iterator] === "function"

const recordToArray = <K extends string, V>(record: Readonly<Partial<Record<K, V>>>) =>
  Object.entries<V | undefined>(record).filter((x): x is [K, Exclude<V, undefined>] => x[1] != null)

const toIterable = <K, V>(seq: Iterable<readonly [K, V]> | MaybeRecord<K, V>): Iterable<readonly [K, V]> =>
  isIterable(seq) ? seq : recordToArray(seq)

// prettier-ignore
const toSet = <T>(set: boolean | Iterable<T> | undefined): true | Set<T> =>
  set === true ? true
  : set === false ? new Set()
  : set instanceof Set ? set
  : new Set(set)

export const tableauModel = <VarKey = string, ConKey = string>(model: Model<VarKey, ConKey>): TableauModel<VarKey> => {
  const { direction, objective, integers, binaries } = model
  const sign = direction === "minimize" ? -1.0 : 1.0

  const constraintsIter = toIterable(model.constraints)
  const variablesIter = toIterable(model.variables)
  const variables: readonly (readonly [VarKey, Coefficients<ConKey>])[] = Array.isArray(variablesIter)
    ? variablesIter
    : Array.from(variablesIter)

  const binaryConstraintCol: number[] = []
  const ints: number[] = []
  if (integers != null || binaries != null) {
    const binaryVariables = toSet(binaries)
    const integerVariables = binaryVariables === true ? true : toSet(integers)
    for (let i = 1; i <= variables.length; i++) {
      const [key] = variables[i - 1]
      if (binaryVariables === true || binaryVariables.has(key)) {
        binaryConstraintCol.push(i)
        ints.push(i)
      } else if (integerVariables === true || integerVariables.has(key)) {
        ints.push(i)
      }
    }
  }

  const constraints = new Map<ConKey, { row: number; lower: number; upper: number }>()
  for (const [key, constraint] of constraintsIter) {
    const bounds = constraints.get(key) ?? { row: NaN, lower: -Infinity, upper: Infinity }
    bounds.lower = Math.max(bounds.lower, constraint.equal ?? constraint.min ?? -Infinity)
    bounds.upper = Math.min(bounds.upper, constraint.equal ?? constraint.max ?? Infinity)
    // if (rows.lower > rows.upper) return ["infeasible", NaN]
    if (!constraints.has(key)) constraints.set(key, bounds)
  }

  let numConstraints = 1
  for (const constraint of constraints.values()) {
    constraint.row = numConstraints
    numConstraints += (Number.isFinite(constraint.lower) ? 1 : 0) + (Number.isFinite(constraint.upper) ? 1 : 0)
  }
  const width = variables.length + 1
  const height = numConstraints + binaryConstraintCol.length
  const numVars = width + height
  const matrix = new Float64Array(width * height)
  const positionOfVariable = new Int32Array(numVars)
  const variableAtPosition = new Int32Array(numVars)
  const tableau = { matrix, width, height, positionOfVariable, variableAtPosition }

  for (let i = 0; i < numVars; i++) {
    positionOfVariable[i] = i
    variableAtPosition[i] = i
  }

  for (let c = 1; c < width; c++) {
    for (const [constraint, coef] of toIterable(variables[c - 1][1])) {
      if (constraint === objective) {
        update(tableau, 0, c, sign * coef)
      }
      const bounds = constraints.get(constraint)
      if (bounds != null) {
        if (Number.isFinite(bounds.upper)) {
          update(tableau, bounds.row, c, coef)
          if (Number.isFinite(bounds.lower)) {
            update(tableau, bounds.row + 1, c, -coef)
          }
        } else if (Number.isFinite(bounds.lower)) {
          update(tableau, bounds.row, c, -coef)
        }
      }
    }
  }

  for (const bounds of constraints.values()) {
    if (Number.isFinite(bounds.upper)) {
      update(tableau, bounds.row, 0, bounds.upper)
      if (Number.isFinite(bounds.lower)) {
        update(tableau, bounds.row + 1, 0, -bounds.lower)
      }
    } else if (Number.isFinite(bounds.lower)) {
      update(tableau, bounds.row, 0, -bounds.lower)
    }
  }

  for (let b = 0; b < binaryConstraintCol.length; b++) {
    const row = numConstraints + b
    update(tableau, row, 0, 1.0)
    update(tableau, row, binaryConstraintCol[b], 1.0)
  }

  return { tableau, sign, variables: variables.map(([k]) => k), integers: ints }
}
