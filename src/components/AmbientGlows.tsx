/** Decorative ambient glows that sit behind all content (z-index: -1). */
export default function AmbientGlows() {
  return (
    <>
      {/* Top radial glow — glacier blue */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[500px] bg-primary/10 blur-[160px] rounded-full pointer-events-none z-[-1] opacity-50"
      />
      {/* Bottom fade-to-black gradient */}
      <div
        aria-hidden="true"
        className="fixed bottom-0 left-0 right-0 h-[300px] bg-gradient-to-t from-background to-transparent pointer-events-none z-[-1]"
      />
    </>
  );
}
