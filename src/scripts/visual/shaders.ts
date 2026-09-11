export const morphVertex = /* glsl */ `
  varying vec2 vUv;
  uniform vec2 uSize;
  uniform float uBend;
  void main() {
    vUv = uv;
    vec3 p = position;
    p.xy *= uSize;
    float wave = sin((uv.x - 0.5) * 3.14159265);
    float envelope = sin(uv.y * 3.14159265);
    p.z += wave * envelope * uBend * min(uSize.x, uSize.y) * 0.42;
    p.y += sin(uv.x * 3.14159265) * uBend * uSize.y * 0.16;
    p.x += envelope * uBend * uSize.x * 0.04;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

export const morphFragment = /* glsl */ `
  varying vec2 vUv;
  uniform vec2 uSize;
  uniform float uRadius;
  uniform float uBend;
  uniform float uFlat;
  uniform vec3 uColor;

  float roundedRect(vec2 p, vec2 halfSize, float radius) {
    vec2 q = abs(p) - halfSize + radius;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - radius;
  }

  void main() {
    vec2 p = (vUv - 0.5) * uSize;
    float radius = min(uRadius, min(uSize.x, uSize.y) * 0.5);
    float d = roundedRect(p, uSize * 0.5, radius);
    float aa = max(fwidth(d), 0.65);
    float alpha = 1.0 - smoothstep(-aa, aa, d);
    if (alpha < 0.001) discard;

    // Procedural grazing light and contours: no image textures or baked text.
    float light = 0.82 + 0.3 * cos(vUv.x * 3.14159265 + uBend * 1.8);
    float line = 1.0 - smoothstep(0.012, 0.028, abs(fract(vUv.x * 22.0) - 0.5));
    float edge = 1.0 - smoothstep(0.5, 1.8, abs(d + 2.0));
    vec3 color = uColor * mix(light, 1.0, uFlat);
    color += (line * 0.022 + edge * 0.065) * (1.0 - uFlat);
    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
