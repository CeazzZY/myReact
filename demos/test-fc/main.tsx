import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/i';

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
	const [num, setNum] = useState(0);
	// useEffect(() => {
	// 	console.log('app mount');
	// }, []);

	useEffect(() => {
		console.log('num change create', num);
		return () => {
			console.log('num change destroy', num);
		};
	}, [num]);
	return (
		<div
			onClick={() => {
				setNum(num + 1);
			}}>
			qqq
		</div>
	);
}

function Child() {
	useEffect(() => {
		console.log('child mount');
		return () => console.log('child unmount');
	}, []);
	return 'i am childe';
}
