import { BULLET_ROW_STYLE, BULLET_DOT_STYLE } from "@/lib/template-styles";

/** Bullet-point row used inside resume and academic-CV templates. */
export function BulletItem({ children }: { children: React.ReactNode }) {
  return (
    <div style={BULLET_ROW_STYLE}>
      <span style={BULLET_DOT_STYLE}>
        <span
          style={{
            display: "inline-block",
            width: "4.5pt",
            height: "4.5pt",
            borderRadius: "50%",
            backgroundColor: "#000",
            verticalAlign: "middle",
          }}
        />
      </span>
      <span style={{ flex: 1, textAlign: "justify" }}>{children}</span>
    </div>
  );
}
