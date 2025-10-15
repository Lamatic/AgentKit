"use client"
import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

function createCarveAlphaMap(size = 1024) {
  const cvs = document.createElement("canvas")
  cvs.width = cvs.height = size
  const ctx = cvs.getContext("2d")!
  ctx.fillStyle = "#fff"
  ctx.fillRect(0, 0, size, size)

  ctx.fillStyle = "#000"
  // Eyes
  ctx.beginPath()
  ctx.ellipse(size * 0.33, size * 0.38, size * 0.07, size * 0.11, -0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(size * 0.66, size * 0.38, size * 0.07, size * 0.11, 0.3, 0, Math.PI * 2)
  ctx.fill()

  // Mouth
  ctx.beginPath()
  const mx = size * 0.5,
    my = size * 0.68
  ctx.moveTo(mx - size * 0.3, my - size * 0.05)
  ctx.quadraticCurveTo(mx - size * 0.05, my + size * 0.12, mx - size * 0.05, my + size * 0.12)
  ctx.quadraticCurveTo(mx + size * 0.05, my + size * 0.25, mx + size * 0.3, my + size * 0.05)
  ctx.lineTo(mx + size * 0.3, my + size * 0.14)
  ctx.quadraticCurveTo(mx + size * 0.05, my + size * 0.36, mx - size * 0.05, my + size * 0.14)
  ctx.quadraticCurveTo(mx - size * 0.05, my + size * 0.12, mx - size * 0.3, my + size * 0.14)
  ctx.closePath()
  ctx.fill()

  // Random erosion
  ctx.globalCompositeOperation = "destination-out"
  for (let i = 0; i < 2200; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const r = Math.random() * 2.2
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  const tex = new THREE.CanvasTexture(cvs)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(1, 1)
  tex.anisotropy = 4
  return tex
}

function PumpkinBody() {
  const meshRef = useRef<THREE.Mesh>(null!)

  const { geometry, material } = useMemo(() => {
    const radius = 1.6
    const height = 1.6
    const ribs = 12
    const segments = 120
    const noise = 0.06

    const halfH = height / 2
    const profile = []
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const y = -halfH + t * height
      const base = radius * (0.9 + 0.6 * Math.sin(Math.PI * t))
      profile.push(new THREE.Vector2(base, y))
    }

    const lathe = new THREE.LatheGeometry(profile, 200)
    const pos = lathe.attributes.position
    const v = new THREE.Vector3()

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i)
      const theta = Math.atan2(v.z, v.x)
      const r = Math.sqrt(v.x * v.x + v.z * v.z)
      const ribFactor = 1 + 0.12 * Math.sin(ribs * theta + Math.sin(v.y * 6) * 0.1)
      const radialNoise = 1 + noise * (Math.sin(v.y * 12 + theta * 3.7) * 0.5 + Math.random() * 0.02)
      const newR = r * ribFactor * radialNoise
      const scale = newR / (r || 1e-6)
      pos.setXYZ(i, v.x * scale, v.y, v.z * scale)
    }
    pos.needsUpdate = true
    lathe.computeVertexNormals()

    const alpha = createCarveAlphaMap()
    const mat = new THREE.MeshStandardMaterial({
      color: 0xff7f11,
      metalness: 0.0,
      roughness: 0.55,
      emissive: 0x000000,
      emissiveIntensity: 0.0,
      alphaMap: alpha,
      transparent: false,
    })

    return { geometry: lathe, material: mat }
  }, [])

  return <mesh ref={meshRef} geometry={geometry} material={material} castShadow receiveShadow />
}

function PumpkinStem() {
  const meshRef = useRef<THREE.Mesh>(null!)

  const { geometry, material } = useMemo(() => {
    const height = 0.65
    const radiusTop = 0.12
    const radiusBottom = 0.18
    const radialSegments = 18
    const heightSegments = 40

    const geom = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, true)
    const pos = geom.attributes.position
    const v = new THREE.Vector3()

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i)
      const pct = (v.y + height / 2) / height
      const bend = Math.sin(pct * Math.PI) * 0.35
      const twist = pct * 3.6
      const cx = v.x * Math.cos(twist) - v.z * Math.sin(twist)
      const cz = v.x * Math.sin(twist) + v.z * Math.cos(twist)
      v.x = cx + bend
      v.z = cz
      v.x += Math.sin(pct * 50 + i) * 0.01 + (Math.random() - 0.5) * 0.01
      v.z += Math.cos(pct * 40 + i) * 0.01 + (Math.random() - 0.5) * 0.01
      pos.setXYZ(i, v.x, v.y, v.z)
    }
    pos.needsUpdate = true
    geom.computeVertexNormals()

    const mat = new THREE.MeshStandardMaterial({ color: 0x4b3b1f, roughness: 0.7, metalness: 0.0 })
    return { geometry: geom, material: mat }
  }, [])

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={[0, 0.95, 0]}
      rotation={[0, 0, -0.35]}
      castShadow
    />
  )
}

function InnerGlow() {
  return (
    <mesh scale={[0.98, 1.02, 0.98]}>
      <sphereGeometry args={[1.46, 40, 32]} />
      <meshBasicMaterial color={0xff8f33} opacity={0.6} transparent side={THREE.BackSide} />
    </mesh>
  )
}

export default function AdvancedPumpkin() {
  const groupRef = useRef<THREE.Group>(null!)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.08
    }
  })

  return (
    <group ref={groupRef} position={[0, -0.65, 0]}>
      <PumpkinBody />
      <InnerGlow />
      <PumpkinStem />
    </group>
  )
}
