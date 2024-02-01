import {
	UpdateQueue,
	createUpdate,
	createUpdateQueue,
	enqueueUpdate
} from './updateQueue';
import { FiberNode, FiberRootNode } from './fiber';
import { HostRoot } from './workTags';
import { Container } from 'hostConfig';
import { ReactElementType } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';

export function createContainer(container: Container): FiberRootNode {
	//创建根fiber
	const hostRootFiber = new FiberNode(HostRoot, {}, null);

	//创建根节点，并将根节点的current指向根fiber
	const root = new FiberRootNode(container, hostRootFiber);

	//将更新队列挂载到根fiber上
	hostRootFiber.updateQueue = createUpdateQueue();

	return root;
}

export function updateContainer(
	element: ReactElementType | null, //eg: <App/>
	root: FiberRootNode
) {
	const hostRootFiber = root.current;
	const update = createUpdate<ReactElementType | null>(element);

	//向根fiber的更新队列中添加一次更新
	enqueueUpdate(
		hostRootFiber.updateQueue as UpdateQueue<ReactElementType | null>,
		update
	);

	scheduleUpdateOnFiber(hostRootFiber);

	return element;
}
