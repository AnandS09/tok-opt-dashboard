import { Component, type ReactNode } from "react";
import { Notice } from "./Notice";

interface Props {
  /** When this changes after a failure, the chart is tried again. */
  resetKey: unknown;
  children: ReactNode;
}

/** Keeps one chart that throws from blanking the whole page. */
export class ChartBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidUpdate(prev: Props) {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) {
      this.setState({ failed: false });
    }
  }

  render() {
    if (this.state.failed) {
      return (
        <Notice title="This chart could not be drawn" role="alert">
          The other charts are unaffected. Try another slide or reset the knobs.
        </Notice>
      );
    }
    return this.props.children;
  }
}
