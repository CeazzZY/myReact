import React from 'react';
import { useState } from 'react';
import ReactDOM from 'react-dom/client';

const [num, setNum] = useState(11000);

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);

function App() {
	return (
		<div>
			<span>1</span>
		</div>
	);
}
