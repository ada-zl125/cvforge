import { BULLET_ROW_STYLE, BULLET_DOT_STYLE } from "@/lib/template-styles";

/** Bullet-point row used inside resume and academic-CV templates. */
export function BulletItem({ children }: { children: React.ReactNode }) {
  return (
    <div style={BULLET_ROW_STYLE}>
      <span style={BULLET_DOT_STYLE}>●</span>
      <span style={{ flex: 1 }}>{children}</span>
    </div>
  );
}
