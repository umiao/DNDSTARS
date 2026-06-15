declare module '@3d-dice/dice-box' {
  export interface DiceBoxConfig {
    container?: string | HTMLElement
    assetPath: string
    origin?: string
    theme?: string
    themeColor?: string
    scale?: number
    gravity?: number
    mass?: number
    friction?: number
    restitution?: number
    angularDamping?: number
    linearDamping?: number
    spinForce?: number
    throwForce?: number
    startingHeight?: number
    settleTimeout?: number
    offscreen?: boolean
    enableShadows?: boolean
    shadowTransparency?: number
  }

  export interface DiceBoxRollResult {
    value?: number
    result?: number
    rolls?: DiceBoxRollResult[]
    rollsArray?: DiceBoxRollResult[]
  }

  export default class DiceBox {
    constructor(config: DiceBoxConfig)
    constructor(selector: string, config: DiceBoxConfig)
    init(): Promise<void>
    roll(notation: string | object | Array<string | object>, options?: object): Promise<DiceBoxRollResult[]>
    clear(): void
  }
}
