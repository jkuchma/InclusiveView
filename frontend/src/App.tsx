import { useState } from "react";
import { KioskScreen } from "./components/KioskScreen";
import { AdaptationDebugPanel } from "./components/AdaptationDebugPanel";
import { useAdaptation } from "./hooks/useAdaptation";

function App() {
  const { sensor, adaptation, connected, caneStub, toggleCane } = useAdaptation();

  const [debugVisible, setDebugVisible] = useState(true);

  return (
    <>
      <KioskScreen adaptation={adaptation} sensor={sensor} />
      <AdaptationDebugPanel
        sensor={sensor}
        adaptation={adaptation}
        connected={connected}
        caneStub={caneStub}
        onToggleCane={toggleCane}
        visible={debugVisible}
        onToggleVisible={() => setDebugVisible((v) => !v)}
      />
    </>
  );
}

export default App;