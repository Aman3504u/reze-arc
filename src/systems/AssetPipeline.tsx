import { useGLTF } from '@react-three/drei'

/**
 * GLTF / KTX2 / Draco asset pipeline helper.
 *
 * drei's `useGLTF` already installs a Draco loader under the hood and will
 * transparently decode Draco-compressed meshes. For KTX2 (Basis Universal)
 * textures, see the README — the recommended flow is to pipe models through
 * `gltf-transform` at build time:
 *
 *   npx gltf-transform optimize in.glb out.glb \
 *     --compress meshopt --texture-compress ktx2
 *
 * This module exposes a tiny `preloadModel` helper so scenes can warm
 * critical assets from the orchestrator without each component duplicating
 * paths. The project ships without bundled GLBs to keep the repo lean;
 * anything you drop into `/public/models/*.glb` will be loaded with full
 * compression support automatically.
 */

const registry = new Set<string>()

export function preloadModel(url: string) {
  if (registry.has(url)) return
  registry.add(url)
  useGLTF.preload(url)
}

export function preloadAll(urls: string[]) {
  urls.forEach(preloadModel)
}
