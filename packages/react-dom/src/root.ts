import { ReactElementType } from './../../shared/ReactTypes';
import {
	createContainer,
	updateContainer
} from 'react-reconciler/src/fiberReconciler';
import { Container } from './hostConfig';

/*


ReactDOM.createRoot(root).render(<App/>)
*/

export function createRoot(container: Container) {
	const root = createContainer(container);

	return {
		render(element: ReactElementType) {
			updateContainer(element, root);
		}
	};
}
