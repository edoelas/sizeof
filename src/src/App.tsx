import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ComponentViewer } from './components/ComponentViewer';
import './index.css';

function App() {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Sidebar onSelect={setSelectedPath} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, margin: 0, backgroundColor: '#fff' }}>
        {selectedPath ? (
          <ComponentViewer path={selectedPath} />
        ) : (
          <div style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#888'
          }}>
            Select a component from the sidebar to view details.
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
