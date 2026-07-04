import React from "react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";
import { VisuallyHidden } from "./ui/visually-hidden";
import { About } from "./About";

interface LogoProps {
    isCollapsed: boolean;
}

// Otto Scribe brand mark (docs/otto/stich-design2): lavender "O" tile +
// "Otto AI" / "Second Brain" wordmark.
const LAVENDER = "#c2c1ff";
const LAVENDER_CONTAINER = "#5e5ce6";

const Logo = React.forwardRef<HTMLButtonElement, LogoProps>(({ isCollapsed }, ref) => {
  return (
    <Dialog aria-describedby={undefined}>
      {isCollapsed ? (
        <DialogTrigger asChild>
          <button ref={ref} className="flex items-center justify-center mb-2 cursor-pointer bg-transparent border-none p-0 hover:opacity-80 transition-opacity">
            <span
              className="flex items-center justify-center rounded-lg font-semibold"
              style={{ width: 32, height: 32, background: LAVENDER_CONTAINER, color: "#f4f1ff", fontSize: 16 }}
            >
              O
            </span>
          </button>
        </DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <button className="flex items-center gap-3 mb-2 cursor-pointer bg-transparent border-none p-0 hover:opacity-80 transition-opacity">
            <span
              className="flex items-center justify-center rounded-lg font-semibold"
              style={{ width: 32, height: 32, background: LAVENDER_CONTAINER, color: "#f4f1ff", fontSize: 16 }}
            >
              O
            </span>
            <span className="flex flex-col items-start leading-tight">
              <span style={{ color: LAVENDER, fontWeight: 700, fontSize: 18 }}>Otto AI</span>
              <span style={{ color: "#9a98a6", fontSize: 11, letterSpacing: "0.05em", fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace" }}>Second Brain</span>
            </span>
          </button>
        </DialogTrigger>
      )}
      <DialogContent>
        <VisuallyHidden>
          <DialogTitle>About Otto Scribe</DialogTitle>
        </VisuallyHidden>
        <About />
      </DialogContent>
    </Dialog>
  );
});

Logo.displayName = "Logo";

export default Logo;