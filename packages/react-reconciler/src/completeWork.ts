import {
	Container,
	Instance,
	appendInitialChild,
	createInstance,
	createTextInstance
} from 'hostConfig';
import { FiberNode } from './fiber';
import {
	ContextProvider,
	Fragment,
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';
import { NoFlags, Ref, Update } from './fiberFlags';
import { popProvider } from './fiberContext';

export const completeWork = (wip: FiberNode) => {
	//递归

	const newProps = wip.pendingProps;
	const current = wip.alternate;

	switch (wip.tag) {
		case HostComponent:
			if (current !== null && wip.stateNode) {
				//update
				markUpdate(wip);
				if (current.ref !== wip.ref) {
					markRef(wip);
				}
			} else {
				//1.构建DOM
				const instance = createInstance(wip.type, newProps);
				//2.将DOM插入到DOM树中
				appendAllChildren(instance, wip);
				wip.stateNode = instance;
				if (wip.ref === null) {
					markRef(wip);
				}
			}
			bubbleProperties(wip);
			return null;
		case HostText:
			if (current !== null && wip.stateNode) {
				//update
				const oldText = current.memoizedProps.content;
				const newText = newProps.content;
				if (oldText !== newText) {
					markUpdate(wip);
				}
			} else {
				//1.构建DOM
				const instance = createTextInstance(newProps.content);
				//2.将DOM插入到DOM树中
				wip.stateNode = instance;
			}
			bubbleProperties(wip);
			return null;
		case HostRoot:
		case FunctionComponent:
		case Fragment:
			bubbleProperties(wip);
			return null;
		case ContextProvider:
			const context = wip.type._context;
			popProvider(context);
			bubbleProperties(wip);
			return null;
		default:
			if (__DEV__) {
				console.warn('未处理的completeWork情况', wip);
			}
			break;
	}
};

function markUpdate(fiber: FiberNode) {
	fiber.flags |= Update;
}

function appendAllChildren(parent: Container | Instance, wip: FiberNode) {
	let node = wip.child;

	while (node !== null) {
		if (node.tag === HostComponent || node.tag === HostText) {
			appendInitialChild(parent, node?.stateNode);
		} else if (node.child !== null) {
			node.child.return = node;
			node = node.child;
			continue;
		}

		if (node === wip) {
			return;
		}

		while (node.sibling === null) {
			if (node.return === null || node.return === wip) {
				return;
			}
			node = node?.return;
		}
		node.sibling.return = node.return;
		node = node.sibling;
	}
}

//将子fiber的副作用flags冒泡到父fiber中，方便查找
function bubbleProperties(wip: FiberNode) {
	let subtreeFlags = NoFlags;
	let child = wip.child;

	while (child !== null) {
		subtreeFlags |= child.subtreeFlags;
		subtreeFlags |= child.flags;

		child.return = wip;
		child = child.sibling;
	}
	wip.subtreeFlags |= subtreeFlags;
}

function markRef(fiber: FiberNode) {
	fiber.flags |= Ref;
}
