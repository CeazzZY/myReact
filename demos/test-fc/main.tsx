import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);

// function App() {
// 	const [num, setNum] = useState(0);
// 	return (
// 		<div>
// 			<div onClick={() => setNum(num + 1)}>change</div>
// 			<>
// 				<div key="1">1</div>
// 				{num % 2 === 1 && (
// 					// <>
// 					// 	<div>2</div>
// 					// </>
// 					<Child />
// 				)}
// 				<div key="3">3</div>
// 				<div key="4">4</div>
// 			</>
// 		</div>
// 	);
// }

// function Child() {
// 	return (
// 		<>
// 			<>
// 				<div>11</div>
// 			</>
// 			<div>
// 				<div>22</div>
// 				<div>33</div>
// 			</div>
// 		</>
// 	);
// }

function App() {
	const [num, setNum] = useState(100);

	return (
		<ul onClick={() => setNum(50)}>
			{new Array(num).fill(0).map((_, i) => {
				return <Child key={i}>{i}</Child>;
			})}
		</ul>
	);
}

function Child({ children }) {
	const now = performance.now();
	while (performance.now() - now < 4) {}
	return <li>{children}</li>;
}
