import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);

// function App() {
// 	const [num, setNum] = useState(0);
// 	return (
// 		<div>
// 			<div onClick={() => setNum(num + 1)}>change</div>
// 			<>
// 				<div>
// 					<span>0.1</span>
// 					<span>
// 						<p>0.2</p>
// 					</span>
// 				</div>
// 				{num % 2 === 1 && (
// 					<>
// 						<span>2.1</span>
// 						<span>
// 							<p>2.2</p>
// 						</span>
// 					</>
// 				)}
// 				<div>
// 					<span>3.1</span>
// 					<span>
// 						<p>3.2</p>
// 					</span>
// 				</div>
// 			</>
// 		</div>
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
