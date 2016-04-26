import {Injectable, Injector, OnInit, NgZone} from "angular2/core";
import {Http, Response, Headers} from 'angular2/http';

import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/map';
import 'rxjs/Rx';

export interface Notification {
	message: string,
	type: boolean,
	error: boolean
}

export interface NotifyTarget {
	target: string,
	payload: boolean
}

export interface NotifyModal {
	message: string,
	heading: string,
	target?: string,
	display: string,
	error: boolean
}

@Injectable()
export class NotificationModalService {
	notifyModalObr$: Observable<NotifyModal>;
	notifyTargetObr$: Observable<NotifyTarget>;

	notifyModalOb: Observer<NotifyModal>;
	notifyTargetOb: Observer<NotifyTarget>;

	constructor() {
		this.notifyModalObr$ = new Observable<NotifyModal>(observer => this.notifyModalOb = observer).share();
		this.notifyTargetObr$ = new Observable<NotifyTarget>(observer => this.notifyTargetOb = observer).share();
	}

	show(notifyModal: NotifyModal) {
		this.notifyModalOb.next(notifyModal);
	}

	notify(notifyTarget: NotifyTarget) {
		if (this.notifyTargetOb) {
			if (!this.notifyTargetOb.isUnsubscribed) {
				this.notifyTargetOb.next(notifyTarget);
			}
		}
	}
}


@Injectable()
export class NotificationService {
	notification$: Observable<Notification>;
	private observer: Observer<Notification>;

	timeout: any;

	notification: Notification;

	constructor(private http: Http) {
		this.notification$ = new Observable<Notification>(observer => this.observer = observer).share();
	}

	notify(message, type, error = false): void {
		this.notification = {
			message: message,
			type: type,
			error: error
		};

		clearTimeout(this.timeout);

		this.observer.next({
			message: message,
			type: type,
			error: error
		});

		this.timeout = setTimeout(() => {
			let {message, error} = this.notification;
			this.observer.next({
				message: message,
				type: false,
				error: error
			});
		}, 4000);
	}
}