/** ContactShadows 대체 — curved geometry에서 NaN bounding sphere 방지 */
export function FloorShadow({ y = -1.6, radius = 2.8, opacity = 0.2 }: {
  y?: number
  radius?: number
  opacity?: number
}) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} renderOrder={-1}>
      <circleGeometry args={[radius, 64]} />
      <meshBasicMaterial color="#2a2a2a" transparent opacity={opacity} depthWrite={false} />
    </mesh>
  )
}
