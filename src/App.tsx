import { Routes, Route} from 'react-router-dom';
import { DemoProductSceneCreator } from './pages/DemoProductSceneCreator';

function App() {
  return (
    <Routes>
      <Route path="/" element={<DemoProductSceneCreator />} />
    </Routes>
  );
}

export default App;