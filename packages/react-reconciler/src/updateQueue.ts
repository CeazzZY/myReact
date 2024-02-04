import { Dispatch } from 'react/src/currentDispatcher';
import { Action } from './../../shared/ReactTypes';
import { Lane } from './fiberLanes';
export interface Update<State> {
	action: Action<State>;
	lane: Lane;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	next: Update<any> | null;
}

export interface UpdateQueue<State> {
	shared: {
		pending: Update<State> | null;
	};
	dispatch: Dispatch<State> | null;
}

//创造一次更新
export const createUpdate = <State>(
	action: Action<State>,
	lane: Lane
): Update<State> => {
	return {
		action,
		lane,
		next: null
	};
};

//创造更新队列
export const createUpdateQueue = <State>() => {
	return {
		shared: {
			pending: null
		},
		dispatch: null
	} as UpdateQueue<State>;
};

//将更新添加到更新队列中
export const enqueueUpdate = <State>(
	updateQueue: UpdateQueue<State>,
	update: Update<State>
) => {
	const pending = updateQueue.shared.pending;
	if (pending === null) {
		update.next = update;
	} else {
		update.next = pending.next;
		pending.next = update;
	}
	updateQueue.shared.pending = update;
};

//
export const processUpdateQueue = <State>(
	baseState: State,
	pendingUpdate: Update<State> | null
): { memoizedState: State } => {
	const result: ReturnType<typeof processUpdateQueue<State>> = {
		memoizedState: baseState
	};
	if (pendingUpdate !== null) {
		const action = pendingUpdate.action;
		if (action instanceof Function) {
			result.memoizedState = action(baseState);
		} else {
			result.memoizedState = action;
		}
	}

	return result;
};
