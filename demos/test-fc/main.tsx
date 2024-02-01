import React from 'react';
import { useState } from 'react';
import ReactDOM from 'react-dom/client';

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);

function App() {
	const [num, setNum] = useState(1);

	const arr =
		num % 2 === 0
			? [<li key="1">1</li>, <li key="2">2</li>, <li key="3">3</li>]
			: [<li key="3">3</li>, <li key="2">2</li>, <li key="1">1</li>];

	return <ul onClickCapture={() => setNum(num + 1)}>{arr}</ul>;

	return (
		<div className="aa" onClick={() => setNum(num + 1)}>
			<span>{num + 2}</span>
		</div>
	);
}
