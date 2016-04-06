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


@Injectable()
export class NotificationService {
	notification$: Observable<Notification>;
	private observer: Observer<Notification>;

	timeout: any;

	notification: Notification;

	constructor(private http: Http) {
		this.notification$ = new Observable<Notification>(observer => this.observer = observer).share();
	}

	notify(message, type, error): void {
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