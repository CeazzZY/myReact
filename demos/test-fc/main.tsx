import { Fragment, Suspense, useEffect, useState, use } from 'react';
import ReactDOM from 'react-dom/client';

// 简单例子 + 没有Suspense catch的情况
function App() {
	const [num, update] = useState(0);
	console.log('app', num);
	return (
		<div
			onClick={() => {
				update(1);
			}}>
			<Cpn />
		</div>
	);
}

function Cpn() {
	console.log('cpn render');
	return <div>cpn</div>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
