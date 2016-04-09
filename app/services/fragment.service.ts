import {Injectable, Injector, Inject, OnInit, NgZone} from "angular2/core";
import {Http, Response, Headers} from 'angular2/http';

import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/map';
import 'rxjs/Rx';

import {User, UserType, Fragment} from '../interfaces/interface';
import {AuthService} from '../auth/auth.service';


export interface Notification {
	message: string,
	type: boolean
}


@Injectable()
export class FragmentService {
	notification$: Observable<Notification>;
	private observer: Observer<Notification>;

	authService: AuthService;

	fragments: [Fragment];

	constructor(
		private http: Http,
		@Inject(AuthService) AuthService
	) {
		this.authService = AuthService;
		this.notification$ = new Observable<Notification>(observer => this.observer = observer).share();
	}

	addFragment(fragment: Fragment) {
		
	}
}






// end