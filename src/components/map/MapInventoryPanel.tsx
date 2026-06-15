import EquipmentTab from '../character/EquipmentTab'

/** 地图战斗 · 装备栏 */
export default function MapInventoryPanel({ charId }: { charId: string }) {
  return <EquipmentTab charId={charId} editable={false} />
}
