import {Injectable, Injector, Inject, OnInit, NgZone} from "angular2/core";
import {Http, Response, Headers} from 'angular2/http';

import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/map';
import 'rxjs/Rx';

import {User, UserType} from '../interfaces/interface';
import {AuthService} from '../auth/auth.service';


export interface Notification {
	message: string,
	type: boolean
}

var USERS: [User] = [
	{
		id: "ekny5h2qd",
		fname: "John",
		lname: "Doe",
		email: "john.doe@google.com",
		type: UserType.Faculty,
		meta: {
			avatar: "https://cdn.shopify.com/s/files/1/0521/5917/files/Screen_Shot_2016-03-20_at_4.35.11_PM.png?3896038397320089616"
		}
	},
	{
		id: "czrvbw1fz",
		fname: "Taylor",
		lname: "Swift",
		email: "taylor.swift@google.com",
		type: UserType.Student,
		meta: {
			avatar: "https://cdn.shopify.com/s/files/1/0521/5917/files/Screen_Shot_2016-02-18_at_3.11.09_PM.png?5003393221482762451"
		}
	}
];

@Injectable()
export class UserService {
	notification$: Observable<Notification>;
	private observer: Observer<Notification>;

	authService: AuthService;

	users: [User] = USERS;

	constructor(
		private http: Http,
		@Inject(AuthService) AuthService
	){
		this.authService = AuthService;
		this.notification$ = new Observable<Notification>(observer => this.observer = observer).share();
	}

	getUser(id: string = null) {
		if (id) {
			return Promise.resolve((this.users.filter(user => user.id == id))[0]);
		} else {
			let [_, session] = this.authService.getSession();
			return Promise.resolve(session);
		}
	}
}