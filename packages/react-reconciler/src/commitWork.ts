/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	Container,
	Instance,
	appendChildToContainer,
	commitUpdate,
	insertChildToContainer,
	removeChild
} from 'hostConfig';
import { FiberNode, FiberRootNode, PendingPassiveEffects } from './fiber';
import {
	ChildDeletion,
	Flags,
	LayoutMask,
	MutationMask,
	NoFlags,
	PassiveEffect,
	PassiveMask,
	Placement,
	Ref,
	Update
} from './fiberFlags';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';
import { Effect, FCUpdateQueue } from './fiberHooks';
import { HookHasEffect } from './hookEffectTags';

let nextEffect: FiberNode | null = null;

//1.commit 阶段入口 找到第一个fiber(fiber没有子节点 or fiber的子节点flag没有标记操作)
//2.对该节点进行操作 并开始进行递归中的归
export const commitMutationEffect = commitEffect(
	'mutation',
	MutationMask | PassiveMask,
	commitMutationEffectsOnFiber
);

export const commitLayoutEffect = commitEffect(
	'layout',
	LayoutMask,
	commitLayoutEffectsOnFiber
);

function commitEffect(
	phrase: 'mutation' | 'layout',
	mask: Flags,
	callback: (fiber: FiberNode, root: FiberRootNode) => void
) {
	return (finishedWork: FiberNode, root: FiberRootNode) => {
		nextEffect = finishedWork;

		while (nextEffect !== null) {
			//向下遍历
			const child: FiberNode | null = nextEffect.child;

			if ((nextEffect.subtreeFlags & mask) !== NoFlags && child !== null) {
				nextEffect = child;
			} else {
				//向上遍历 DFS
				up: while (nextEffect !== null) {
					callback(nextEffect, root);
					const sibling: FiberNode | null = nextEffect.sibling;

					if (sibling !== null) {
						nextEffect = sibling;
						break up;
					}
					nextEffect = nextEffect.return;
				}
			}
		}
	};
}

//对当前fiber的flag中的标记进行对应的操作
function commitMutationEffectsOnFiber(
	finishedWork: FiberNode,
	root: FiberRootNode
) {
	const { flags, tag } = finishedWork;

	if ((flags & Placement) !== NoFlags) {
		commitPlacement(finishedWork);
		//将Placement从flag中移除
		finishedWork.flags &= ~Placement;
	}

	//flag Update
	if ((flags & Update) !== NoFlags) {
		commitUpdate(finishedWork);
		finishedWork.flags &= ~Update;
	}
	//flag ChildDeletion
	if ((flags & ChildDeletion) !== NoFlags) {
		const deletion = finishedWork.deletion;
		if (deletion !== null) {
			deletion.forEach((childToDelete) => {
				commitDeletion(childToDelete, root);
			});
		}
		finishedWork.flags &= ~ChildDeletion;
	}
	if ((flags & PassiveEffect) !== NoFlags) {
		//收集回掉
		commitPassiveEffect(finishedWork, root, 'update');
		finishedWork.flags &= ~PassiveEffect;
	}
	if ((flags & Ref) !== NoFlags && tag === HostComponent) {
		safelyDetachRef(finishedWork);
	}
}

function commitLayoutEffectsOnFiber(finishedWork: FiberNode) {
	const { flags, tag } = finishedWork;

	if ((flags & Ref) !== NoFlags && tag === HostComponent) {
		//绑定新的ref
		safelyAttachRef(finishedWork);
		//将Placement从flag中移除
		finishedWork.flags &= ~Ref;
	}
}

function safelyAttachRef(fiber: FiberNode) {
	const ref = fiber.ref;
	if (ref !== null) {
		const instance = fiber.stateNode;
		if (typeof ref === 'function') {
			ref(instance);
		} else {
			ref.current = instance;
		}
	}
}

function safelyDetachRef(current: FiberNode) {
	const ref = current.ref;

	if (ref !== null) {
		if (typeof ref === 'function') {
			ref(null);
		} else {
			ref.current = null;
		}
	}
}

/**
 * 进行插入操作
 *
 *   1.调用getHostParent找到父节点(只能是HostComponent或HostRoot FunctionComponent无效)
 *
 * 	 2.调用getHostSibling找到兄弟节点(有对应的真实DOM 并且 改节点是稳定的 无Placement标记)
 *
 *   3.将当前节点插入到 兄弟节点前
 *
 * **/
const commitPlacement = (finishedWork: FiberNode) => {
	if (__DEV__) {
		console.warn('执行Placement', finishedWork);
	}
	//parent DOM
	const hostParent = getHostParent(finishedWork);

	//host sibling
	const sibling = getHostSibling(finishedWork);

	// finishedWork
	if (hostParent !== null) {
		insertOrAppendPlacementNodeIntoContainer(finishedWork, hostParent, sibling);
	}
};

//用while循环找到第一个HostComponent或HostRoot父节点
function getHostParent(fiber: FiberNode): Container | null {
	let parent = fiber.return;
	while (parent) {
		const parentTag = parent.tag;

		if (parentTag === HostComponent) {
			return parent.stateNode as Container;
		}
		if (parentTag === HostRoot) {
			return (parent.stateNode as FiberRootNode).container;
		}
		parent = parent.return;
	}

	if (__DEV__) {
		console.warn('未找到host parent');
	}
	return null;
}
/**
 * 找兄弟节点
 * 
 *	1. 为了防止出现<A/></div>
		A -> <当前节点/>
	当一开始找不到sibling时 会向上遍历找父节点的sibling(必须 没有 真实DOM)

	2. 为了防止出现<当前节点/> <A/>
	当sibling是没有真实DOM时要向下遍历

	3.最后判断有没有Placement标记 有的话继续找后面的sibling

 * **/
function getHostSibling(fiber: FiberNode) {
	let node: FiberNode = fiber;

	findSibling: while (true) {
		while (node.sibling === null) {
			const parent = node.return;

			if (
				parent === null ||
				parent.tag === HostComponent ||
				parent.tag === HostRoot
			) {
				return null;
			}
			node = parent;
		}
		node.sibling.return = node.return;
		node = node.sibling;

		while (node.tag !== HostText && node.tag !== HostComponent) {
			//向下遍历
			if ((node.flags & Placement) !== NoFlags) {
				continue findSibling;
			}
			if (node.child === null) {
				continue findSibling;
			} else {
				node.child.return = node;
				node = node.child;
			}
		}

		if ((node.flags & Placement) === NoFlags) {
			return node.stateNode;
		}
	}
}

/**
 *将当前fiber的stateNode插入到父DOM中

	1.如果有stateNode就直接插入，有before就插入到before前

	2.没有stateNode 就遍历子节点和子节点的sibling 然后再次调用插入
 * **/
function insertOrAppendPlacementNodeIntoContainer(
	finishedWork: FiberNode,
	hostParent: Container,
	before?: Instance
) {
	//fiber host
	if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
		if (before) {
			insertChildToContainer(finishedWork.stateNode, hostParent, before);
		} else {
			appendChildToContainer(hostParent, finishedWork.stateNode);
		}
		return;
	}

	const child = finishedWork.child;
	if (child !== null) {
		insertOrAppendPlacementNodeIntoContainer(child, hostParent, before);
		let sibling = child.sibling;

		while (sibling !== null) {
			insertOrAppendPlacementNodeIntoContainer(sibling, hostParent, before);
			sibling = sibling.sibling;
		}
	}
}

function commitDeletion(childToDelete: FiberNode, root: FiberRootNode) {
	const rootChildrenToDelete: FiberNode[] = [];

	//递归子树
	commitNestedComponent(childToDelete, (unmountFiber) => {
		switch (unmountFiber.tag) {
			case HostComponent:
				recordHostChildrenToDelete(rootChildrenToDelete, unmountFiber);
				//解绑ref
				safelyDetachRef(unmountFiber);
				return;
			case HostText:
				recordHostChildrenToDelete(rootChildrenToDelete, unmountFiber);

				return;
			case FunctionComponent:
				// useEffect
				commitPassiveEffect(unmountFiber, root, 'unmount');
				return;
			default:
				if (__DEV__) {
					console.warn('未处理的unmount的类型', unmountFiber);
				}
		}
	});

	//移除rootHostComponent的DOM
	if (rootChildrenToDelete.length) {
		const hostParent = getHostParent(childToDelete);
		if (hostParent !== null) {
			rootChildrenToDelete.forEach((node) => {
				removeChild(node.stateNode, hostParent);
			});
		}
	}
	childToDelete.return = null;
	childToDelete.child = null;
}

function commitNestedComponent(
	root: FiberNode,
	onCommitUnmount: (fiber: FiberNode) => void
) {
	let node = root;
	while (true) {
		onCommitUnmount(node);

		if (node.child !== null) {
			node.child.return = node;
			node = node.child;
			continue;
		}
		if (node === root) {
			return;
		}

		while (node.sibling === null) {
			if (node.return === null || node.return === root) {
				return;
			}
			node = node.return;
		}
		node.sibling.return = node.return;
		node = node.sibling;
	}
}

function recordHostChildrenToDelete(
	childrenToDelete: FiberNode[],
	unmountFiber: FiberNode
) {
	//1. 找到第一个root Host节点
	const lastOne = childrenToDelete[childrenToDelete.length - 1];

	//2. 每找到一个 host节点， 判断这个节点是不是上一个节点的兄弟节点
	if (!lastOne) {
		childrenToDelete.push(unmountFiber);
	} else {
		let node = lastOne.sibling;
		while (node !== null) {
			if (unmountFiber === node) {
				childrenToDelete.push(unmountFiber);
			}
			node = node.sibling;
		}
	}
}

function commitPassiveEffect(
	fiber: FiberNode,
	root: FiberRootNode,
	type: keyof PendingPassiveEffects
) {
	//update unmount
	if (
		fiber.tag !== FunctionComponent ||
		(type === 'update' && (fiber.flags & PassiveEffect) === NoFlags)
	) {
		return;
	}
	const updateQueue = fiber.updateQueue as FCUpdateQueue<any>;
	if (updateQueue !== null) {
		if (updateQueue.lastEffect === null && __DEV__) {
			console.warn('当FC存在PassiveEffect flag时,不应该不存在effect');
		}
		root.pendingPassiveEffects[type].push(updateQueue.lastEffect as Effect);
	}
}

export function commitHookEffectListUnmount(flags: Flags, lastEffect: Effect) {
	commitHookEffectList(flags, lastEffect, (effect) => {
		const destroy = effect.destroy;
		if (typeof destroy === 'function') {
			destroy();
		}
		effect.tag &= ~HookHasEffect;
	});
}

export function commitHookEffectListDestroy(flags: Flags, lastEffect: Effect) {
	commitHookEffectList(flags, lastEffect, (effect) => {
		const destroy = effect.destroy;
		if (typeof destroy === 'function') {
			destroy();
		}
	});
}

export function commitHookEffectListCreate(flags: Flags, lastEffect: Effect) {
	commitHookEffectList(flags, lastEffect, (effect) => {
		const create = effect.create;
		if (typeof create === 'function') {
			effect.destroy = create();
		}
	});
}

function commitHookEffectList(
	flags: Flags,
	lastEffect: Effect,
	callback: (effect: Effect) => void
) {
	let effect = lastEffect.next as Effect;

	do {
		if ((effect.tag & flags) === flags) {
			callback(effect);
		}
		effect = effect.next as Effect;
	} while (effect !== lastEffect.next);
}
