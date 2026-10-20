import { Component, type ReactNode } from "react";
import { Notice } from "./Notice";

interface Props {
  /** When this changes after a failure, the chart is tried again. */
  resetKey: unknown;
  children: ReactNode;
}

/**
 * Keeps one chart that throws from blanking the whole page. The notice names
 * the error, so a chart that fails is never just a blank or generic box.
 */
export class ChartBoundary extends Component<Props, { failed: boolean; reason: string }> {
  state = { failed: false, reason: "" };

  static getDerivedStateFromError(error: unknown) {
    return { failed: true, reason: error instanceof Error ? error.message : String(error) };
  }

  componentDidUpdate(prev: Props) {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) {
      this.setState({ failed: false, reason: "" });
    }
  }

  render() {
    if (this.state.failed) {
      return (
        <Notice title="This chart could not be drawn" role="alert">
          The other charts are unaffected. Try another slide or reset the knobs.
          {this.state.reason ? ` Reason: ${this.state.reason}` : ""}
        </Notice>
      );
    }
    return this.props.children;
  }
}
