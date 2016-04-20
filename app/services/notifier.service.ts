import {Injectable, Inject, Injector, OnInit, NgZone} from "angular2/core";
import {Http, Response, Headers} from 'angular2/http';

import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/map';
import 'rxjs/Rx';

// import {Segment, UserType} from '../interfaces/interface';
import {AuthService} from '../auth/auth.service';
import {FragmentService} from '../services/fragment.service';


var genId = () => {
	return Math.random().toString(36).substr(2, 9);
};


export interface Notifier {
	_id: string,
	type: number,
	_user: string,
	read: boolean,
	data: {
		message: string,
		resource: {}
	},
	created_at?: Date
}


@Injectable()
export class NotifierService {
	
	private pusher: any;

	authService;
	fragmentService;

	session$: Observable<boolean>;
	notifier$: Observable<string>;
	private notifierObserver: Observer<string>;

	constructor(
		private http: Http,
		@Inject(AuthService) AuthService,
		@Inject(FragmentService) FragmentService
	) {
		this.notifier$ = new Observable<string>(observer => this.notifierObserver = observer).share();
		
		this.authService = AuthService;
		this.fragmentService = FragmentService;

		this.session$ = this.authService.session$;
		this.session$.subscribe(
			(response) => {
				if (response) {
					this.setPusher();
				} else {
				}
			});

		this.setPusher();
	}

	getNotifications() {
		return this.http.get(
			`${this.authService.baseUri}/notifications/`,
			{ headers: this.authService.getAuthHeader() }
		)
			.map(res => res.json())
			.toPromise();
	}

	setPusher() {
		console.log("setting up sync mode ...");
		let [exists, session] = this.authService.getSession();
		if (exists) {
			this.pusher = new Pusher('86204f7d8b91b0b741e6', {
				encrypted: true
			});

			let channel = this.pusher.subscribe(`${session.id}`);

			channel.bind('fragment', (data) => {
				this.notifierObserver.next(data);
			});

			channel.bind('invitee', (data) => {
				this.notifierObserver.next(data);
			});


			let fragmentChannel = this.pusher.subscribe(`fragments`);

			fragmentChannel.bind('fragment', (data) => {
				if ('payload' in data) {
					let fragment = data.payload;
					this.fragmentService.notifyFragment(data.fid, fragment, data._user);
				}
			});
		}
	}
}