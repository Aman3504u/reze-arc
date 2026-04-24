import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

// Postprocessing stack. For maximum compatibility with R3F v9 + React 19,
// we keep effect props static and let the dynamic mood come from the shaders
// themselves (sky/floor/icon). Bloom has a low threshold so emissive materials
// always bleed; that plus per-frame shader uniform changes gives the
// perceived dynamism of "the bloom swelling at detonation" without needing
// to imperatively mutate effect instances each frame.

export function PostFX() {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        intensity={1.1}
        luminanceThreshold={0.18}
        luminanceSmoothing={0.35}
        mipmapBlur
      />
      <ChromaticAberration
        offset={[0.001, 0.001]}
        blendFunction={BlendFunction.NORMAL}
        radialModulation={false}
        modulationOffset={0}
      />
      <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.18} />
      <Vignette eskil={false} offset={0.2} darkness={0.85} />
    </EffectComposer>
  );
}
