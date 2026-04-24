import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { forwardRef, useEffect } from 'react'

/**
 * A Reze portrait rendered as an alpha-masked billboard.
 *
 * The artwork is hand-crafted SVG (no copyrighted source frames) living in
 * `/public/images/`. We load it as a THREE texture and draw it on a plane;
 * the scene's rim light + per-act tint supply the cinematic coloring on top.
 *
 * Using a `MeshBasicMaterial` with `toneMapped={false}` keeps the SVG
 * readable through the global post-stack (bloom + chromatic) without the
 * act's light rig dimming the character to near-black.
 */
type Props = {
  variant: 'cafe' | 'rooftop' | 'reveal'
  /** World-space position of the plane's center. */
  position?: [number, number, number]
  /** Plane height in world units; width is derived from the 2:3 SVG aspect. */
  height?: number
  /** Overall opacity — drive this from the scene's sub-progress for fades. */
  opacity?: number
  /** Optional tint multiplied over the texture. Defaults to pure white. */
  tint?: string
  /** Subtle vertical offset modulated by the caller (e.g. breathing). */
  bobY?: number
}

const ASSET: Record<Props['variant'], string> = {
  cafe: '/images/reze-cafe.svg',
  rooftop: '/images/reze-rooftop.svg',
  reveal: '/images/reze-reveal.svg',
}

export const RezePortrait = forwardRef<THREE.Mesh, Props>(function RezePortrait(
  { variant, position = [0, 1.6, 0], height = 2.2, opacity = 1, tint = '#ffffff', bobY = 0 },
  ref,
) {
  const texture = useTexture(ASSET[variant])
  // 2:3 SVG aspect — keep width proportional to avoid squashing.
  const width = (height * 512) / 768

  useEffect(() => {
    // sRGB so the SVG's stated colors survive the linear pipeline.
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
    texture.needsUpdate = true
  }, [texture])

  return (
    <mesh
      ref={ref}
      position={[position[0], position[1] + bobY, position[2]]}
    >
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={texture}
        transparent
        alphaTest={0.02}
        toneMapped={false}
        color={tint}
        opacity={opacity}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
})
