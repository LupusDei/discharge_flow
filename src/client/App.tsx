import { Dashboard } from './views';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Discharge Flow</h1>
        <p>Hospital discharge task management</p>
      </header>
      <main className="app-main">
        <Dashboard />
      </main>
    </div>
  );
}

export default App;
