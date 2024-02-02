import React from 'react';
import { useState } from 'react';
import ReactDOM from 'react-dom/client';

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);

function App() {
	const [num, setNum] = useState(0);
	return <div onClick={() => setNum(num + 1)}>{num}</div>;
}
