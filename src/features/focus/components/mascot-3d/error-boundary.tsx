import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

interface State {
  hasError: boolean;
}

/** Se o Three.js falhar em tempo de execução (contexto WebGL perdido,
 * driver instável, etc.), cai pro mascote em CSS em vez de derrubar a
 * página inteira — precisa ser classe, boundary de erro do React não
 * existe como hook. */
export class Mascot3DErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
