/* eslint-disable @typescript-eslint/no-explicit-any */
//递归中的阶段

import { ReactElementType } from 'shared/ReactTypes';
import {
	FiberNode,
	OffscreenProps,
	createFiberFromFragment,
	createFiberFromOffscreen,
	createWorkInProgress
} from './fiber';
import { UpdateQueue, processUpdateQueue } from './updateQueue';
import {
	ContextProvider,
	Fragment,
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText,
	OffscreenComponent,
	SuspenseComponent
} from './workTags';
import {
	cloneChildFibers,
	mountChildFibers,
	reconcileChildFibers
} from './childFiber';
import { bailoutHook, renderWithHooks } from './fiberHooks';
import { Lane, NoLane, NoLanes, includeSomeLanes } from './fiberLanes';
import {
	ChildDeletion,
	DidCapture,
	NoFlags,
	Placement,
	Ref
} from './fiberFlags';
import { pushProvider } from './fiberContext';
import { pushSuspenseHandler } from './suspenseContext';

//是否命中bailout
let didReceiveUpdate = false;

export function markWipReceivedUpdate() {
	didReceiveUpdate = true;
}

export const beginWork = (wip: FiberNode, renderLane: Lane) => {
	//bailout
	didReceiveUpdate = false;
	const current = wip.alternate;

	if (current !== null) {
		const oldProps = current.memoizedProps;
		const newProps = wip.pendingProps;
		if (oldProps !== newProps || current.type !== wip.type) {
			didReceiveUpdate = true;
		} else {
			// state context
			const hasScheduledStateOrContext = checkScheduledUpdateOrContext(
				current,
				renderLane
			);
			if (!hasScheduledStateOrContext) {
				// 四要素～state context
				// 命中bailout
				didReceiveUpdate = false;

				switch (wip.tag) {
					case ContextProvider:
						const newValue = wip.memoizedProps.value;
						const context = wip.type._context;
						pushProvider(context, newValue);
						break;
					// TODO Suspense
				}

				return bailoutOnAlreadyFinishedWork(wip, renderLane);
			}
		}
	}

	wip.lanes = NoLanes;
	//比较返回子FiberNode
	switch (wip.tag) {
		case HostRoot:
			return updateHostRoot(wip, renderLane);
		case HostComponent:
			return updateHostComponent(wip);
		case HostText:
			return null;
		case FunctionComponent:
			return updateFunctionComponent(wip, renderLane);
		case Fragment:
			return updateFragment(wip);
		case ContextProvider:
			return updateContextProvider(wip);
		case SuspenseComponent:
			return updateSuspenseComponent(wip);
		case OffscreenComponent:
			return updateOffscreenComponent(wip);
		default:
			if (__DEV__) {
				console.warn('beginWork未实现类型');
			}
			break;
	}
	return null;
};

function checkScheduledUpdateOrContext(
	current: FiberNode,
	renderLane: Lane
): boolean {
	const updateLanes = current.lanes;

	if (includeSomeLanes(updateLanes, renderLane)) {
		return true;
	}
	return false;
}

function bailoutOnAlreadyFinishedWork(wip: FiberNode, renderLane: Lane) {
	if (!includeSomeLanes(wip.childrenLanes, renderLane)) {
		if (__DEV__) {
			console.warn('bailout整棵子树', wip);
		}
		return null;
	}

	if (__DEV__) {
		console.warn('bailout一个fiber', wip);
	}
	cloneChildFibers(wip);
	return wip.child;
}

function reconcileChildren(wip: FiberNode, children?: ReactElementType) {
	const current = wip.alternate;

	if (current !== null) {
		wip.child = reconcileChildFibers(wip, current?.child, children);
	} else {
		wip.child = mountChildFibers(wip, null, children);
	}
}

function markRef(current: FiberNode | null, wip: FiberNode) {
	const ref = wip.ref;

	if (
		(current === null && ref !== null) ||
		(current !== null && current.ref !== ref)
	) {
		wip.flags |= Ref;
	}
}

function updateHostRoot(wip: FiberNode, renderLane: Lane) {
	const baseState = wip.memoizedState;
	const updateQueue = wip.updateQueue as UpdateQueue<Element>;
	const pending = updateQueue.shared.pending;
	updateQueue.shared.pending = null;

	const prevChildren = wip.memoizedState;

	const { memoizedState } = processUpdateQueue(baseState, pending, renderLane);

	const current = wip.alternate;
	if (current !== null) {
		if (!current.memoizedState) {
			current.memoizedState = memoizedState;
		}
	}

	wip.memoizedState = memoizedState;

	const nextChildren = wip.memoizedState;
	if (prevChildren === nextChildren) {
		return bailoutOnAlreadyFinishedWork(wip, renderLane);
	}
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

function updateHostComponent(wip: FiberNode) {
	const nextProps = wip.pendingProps;
	const nextChildren = nextProps.children;
	markRef(wip.alternate, wip);
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

function updateFunctionComponent(wip: FiberNode, renderLane: Lane) {
	//render
	const nextChildren = renderWithHooks(wip, renderLane);

	const current = wip.alternate;

	if (current !== null && !didReceiveUpdate) {
		bailoutHook(wip, renderLane);
		return bailoutOnAlreadyFinishedWork(wip, renderLane);
	}

	reconcileChildren(wip, nextChildren);
	return wip.child;
}

function updateFragment(wip: FiberNode) {
	const nextChildren = wip.pendingProps;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

function updateContextProvider(wip: FiberNode) {
	const providerType = wip.type;
	const context = providerType._context;
	const newProps = wip.pendingProps;

	pushProvider(context, newProps.value);

	const nextChildren = newProps.children;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

function updateSuspenseComponent(wip: FiberNode) {
	const current = wip.alternate;
	const nextProps = wip.pendingProps;

	let showFallback = false;
	const didSuspend = (wip.flags & DidCapture) !== NoFlags;

	if (didSuspend) {
		showFallback = true;
		wip.flags &= ~DidCapture;
	}

	const nextPrimaryChildren = nextProps.children;
	const nextFallbackChildren = nextProps.fallback;

	pushSuspenseHandler(wip);

	if (current === null) {
		//mount
		if (showFallback) {
			//挂起
			return mountSuspenseFallbackChildren(
				wip,
				nextPrimaryChildren,
				nextFallbackChildren
			);
		} else {
			//正常
			return mountSuspensePrimaryChildren(wip, nextPrimaryChildren);
		}
	} else {
		if (showFallback) {
			//挂起
			return updateSuspenseFallbackChildren(
				wip,
				nextPrimaryChildren,
				nextFallbackChildren
			);
		} else {
			//正常
			return updateSuspensePrimaryChildren(wip, nextPrimaryChildren);
		}
	}
}

function updateOffscreenComponent(wip: FiberNode) {
	const nextProps = wip.pendingProps;
	const nextChildren = nextProps.children;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

function mountSuspenseFallbackChildren(
	wip: FiberNode,
	primaryChildren: any,
	fallbackChildren: any
) {
	const primaryChildProps: OffscreenProps = {
		mode: 'hidden',
		children: primaryChildren
	};
	const primaryChildFragment = createFiberFromOffscreen(primaryChildProps);
	const fallbackChildFragment = createFiberFromFragment(fallbackChildren, null);

	fallbackChildFragment.flags |= Placement;

	primaryChildFragment.return = wip;
	fallbackChildFragment.return = wip;
	primaryChildFragment.sibling = fallbackChildFragment;
	wip.child = primaryChildFragment;

	return fallbackChildFragment;
}

function mountSuspensePrimaryChildren(wip: FiberNode, primaryChildren: any) {
	const primaryChildProps: OffscreenProps = {
		mode: 'visible',
		children: primaryChildren
	};
	const primaryChildFragment = createFiberFromOffscreen(primaryChildProps);
	wip.child = primaryChildFragment;
	primaryChildFragment.return = wip;
	return primaryChildFragment;
}

function updateSuspenseFallbackChildren(
	wip: FiberNode,
	primaryChildren: any,
	fallbackChildren: any
) {
	const current = wip.alternate as FiberNode;
	const currentPrimaryChildFragment = current.child as FiberNode;
	const currentFallbackChildFragment: FiberNode | null =
		currentPrimaryChildFragment.sibling;

	const primaryChildProps: OffscreenProps = {
		mode: 'hidden',
		children: primaryChildren
	};
	const primaryChildFragment = createWorkInProgress(
		currentPrimaryChildFragment,
		primaryChildProps
	);
	let fallbackChildFragment;

	if (currentFallbackChildFragment !== null) {
		fallbackChildFragment = createWorkInProgress(
			currentFallbackChildFragment,
			fallbackChildren
		);
	} else {
		fallbackChildFragment = createFiberFromFragment(fallbackChildren, null);
		fallbackChildFragment.flags |= Placement;
	}
	fallbackChildFragment.return = wip;
	primaryChildFragment.return = wip;
	primaryChildFragment.sibling = fallbackChildFragment;
	wip.child = primaryChildFragment;

	return fallbackChildFragment;
}

function updateSuspensePrimaryChildren(wip: FiberNode, primaryChildren: any) {
	const current = wip.alternate as FiberNode;
	const currentPrimaryChildFragment = current.child as FiberNode;
	const currentFallbackChildFragment: FiberNode | null =
		currentPrimaryChildFragment.sibling;

	const primaryChildProps: OffscreenProps = {
		mode: 'visible',
		children: primaryChildren
	};

	const primaryChildFragment = createWorkInProgress(
		currentPrimaryChildFragment,
		primaryChildProps
	);

	primaryChildFragment.return = wip;
	primaryChildFragment.sibling = null;
	wip.child = primaryChildFragment;

	if (currentFallbackChildFragment !== null) {
		const deletions = wip.deletion;
		if (deletions === null) {
			wip.deletion = [currentFallbackChildFragment];
			wip.flags |= ChildDeletion;
		} else {
			deletions.push(currentFallbackChildFragment);
		}
	}

	return primaryChildFragment;
}
