import React from 'react';
import { useState } from 'react';
import ReactDOM from 'react-dom/client';

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);

function App() {
	const [num, setNum] = useState(1);
	window.setNum = setNum;

	return num !== 2 ? <div>{num}</div> : <div>dengyu 2</div>;
}
