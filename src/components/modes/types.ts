import type { ModeOutput } from "@/lib/intent";

/** Shared contract for every input-mode component. */
export interface ModeProps {
  /** Emit raw mode output; the wizard normalizes + starts the session. */
  onSubmit: (output: ModeOutput) => void;
  /** True while the session/recommendations request is in flight. */
  busy?: boolean;
}
